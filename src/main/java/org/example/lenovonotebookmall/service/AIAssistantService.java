package org.example.lenovonotebookmall.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.Product;
import org.example.lenovonotebookmall.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AIAssistantService {
    private final ProductRepository productRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.api.url}")
    private String apiUrl;

    @Value("${ai.model}")
    private String model;

    // 存储每个会话的对话历史（简单实现，生产环境应该用Redis或数据库）
    private final Map<String, List<Map<String, String>>> conversationHistory = new ConcurrentHashMap<>();

    public String chat(String userMessage) {
        return chat(userMessage, "default"); // 默认会话ID
    }

    public String chat(String userMessage, String sessionId) {
        try {
            List<Product> products = productRepository.findAll();
            String productContext = buildProductContext(products);
            String systemPrompt = buildSystemPrompt(productContext);

            // 获取或创建对话历史
            List<Map<String, String>> history = conversationHistory.computeIfAbsent(
                sessionId, k -> new ArrayList<>()
            );

            // 构建消息列表（包含历史）
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // 添加历史对话（最多保留最近10轮）
            int startIndex = Math.max(0, history.size() - 20); // 10轮 = 20条消息
            messages.addAll(history.subList(startIndex, history.size()));

            // 添加当前用户消息
            messages.add(Map.of("role", "user", "content", userMessage));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 1500);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            System.out.println("=== 发送请求到: " + apiUrl + " ===");

            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, String.class);

            System.out.println("=== API响应状态: " + response.getStatusCode() + " ===");

            JsonNode root = objectMapper.readTree(response.getBody());

            String aiResponse = null;
            if (root.has("choices") && root.get("choices").size() > 0) {
                JsonNode choice = root.get("choices").get(0);
                if (choice.has("message") && choice.get("message").has("content")) {
                    aiResponse = choice.get("message").get("content").asText();
                }
            }

            // 其他可能的格式
            if (aiResponse == null && root.has("data")) {
                aiResponse = root.get("data").asText();
            }

            if (aiResponse == null && root.has("response")) {
                aiResponse = root.get("response").asText();
            }

            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                System.err.println("=== 无法从API响应中提取内容 ===");
                return fallbackResponse(userMessage);
            }

            System.out.println("=== AI原始回复 ===");
            System.out.println(aiResponse);

            String result = enrichResponseWithLinks(aiResponse, products);

            // 保存到对话历史
            history.add(Map.of("role", "user", "content", userMessage));
            history.add(Map.of("role", "assistant", "content", aiResponse));

            // 限制历史长度（最多保留50条消息）
            if (history.size() > 50) {
                history.subList(0, history.size() - 50).clear();
            }

            return result;

        } catch (Exception e) {
            System.err.println("=== API调用异常 ===");
            e.printStackTrace();
            return fallbackResponse(userMessage);
        }
    }

    public void clearHistory(String sessionId) {
        conversationHistory.remove(sessionId);
    }

    private String buildProductContext(List<Product> products) {
        StringBuilder sb = new StringBuilder("【商城商品数据库】\n\n");

        products.forEach(p -> {
            sb.append(String.format("商品ID:%d | 名称:%s | 型号:%s | 价格:¥%.2f | 库存:%d\n",
                    p.getId(), p.getName(), p.getModel(), p.getPrice(), p.getStock()));
            if (p.getCpu() != null) sb.append(String.format("  处理器:%s\n", p.getCpu()));
            if (p.getMemory() != null) sb.append(String.format("  内存:%s\n", p.getMemory()));
            if (p.getStorage() != null) sb.append(String.format("  存储:%s\n", p.getStorage()));
            if (p.getGraphics() != null) sb.append(String.format("  显卡:%s\n", p.getGraphics()));
            if (p.getCategory() != null) sb.append(String.format("  分类:%s\n", p.getCategory()));
            sb.append("\n");
        });

        return sb.toString();
    }

    private String buildSystemPrompt(String productContext) {
        return """
            你是联想笔记本商城的专业AI购物助手，精通电脑硬件和笔记本选购。
            
            【核心能力】
            1. 根据用户预算、需求推荐最合适的笔记本
            2. 详细对比处理器性能（如12700H vs 13700H的具体差异）
            3. 解答所有电脑硬件相关问题（CPU、GPU、内存、存储、屏幕等）
            4. 分析使用场景（办公、游戏、设计、编程、学生等）的配置需求
            5. 解释技术参数和行业术语
            
            【回答规则】
            1. 推荐商品时必须基于下方的商品数据库，使用格式：商品名称(ID:商品ID)
            2. 例如：【ThinkPad X1】(ID:5) 或 【联想拯救者Y9000P】(ID:12)
            3. 对比处理器时要给出具体性能提升百分比和应用场景差异
            4. 回答要专业、详细，包含技术原理和实际应用建议
            5. 如果用户问题模糊（如"推荐笔记本"、"适合我"），主动询问预算和用途
            6. 如果问题与电脑无关，礼貌拒绝并引导回电脑话题
            7. 回答使用HTML格式，包含<h3>、<strong>、<br>等标签美化排版
            
            【处理器性能参考】
            - 13代酷睿比12代：单核提升15-20%，多核提升10-15%
            - i7比i5：多核性能提升25-30%，适合重度多任务
            - H系列比U系列：性能提升40-50%，功耗高但性能强
            - AMD Ryzen 7000系列：与Intel 13代性能相当
            
            【用户群体配置建议】
            - 大学生：4000-7000元，轻薄便携，16GB内存，512GB存储
            - 程序员：6000+元，i7/R7，32GB内存，多核心重要
            - 游戏玩家：7000+元，RTX 4060+，高刷屏，散热好
            - 设计师：8000+元，色域广，独显，大内存
            
            """ + productContext;
    }

    private String enrichResponseWithLinks(String aiResponse, List<Product> products) {
        String result = aiResponse;

        System.out.println("=== 开始处理链接 ===");
        Set<Long> linkedProductIds = new HashSet<>();

        for (Product p : products) {
            String productName = p.getName();
            Long productId = p.getId();

            // 1. 匹配格式：【商品名称】(ID:数字)
            String pattern1 = "【" + Pattern.quote(productName) + "】\\s*\\(ID:\\s*" + productId + "\\)";
            Matcher m1 = Pattern.compile(pattern1).matcher(result);
            if (m1.find()) {
                String replacement = buildProductCard(p);
                result = m1.replaceAll(Matcher.quoteReplacement(replacement));
                linkedProductIds.add(productId);
                continue;
            }

            // 2. 匹配格式：商品名称(ID:数字)
            String pattern2 = Pattern.quote(productName) + "\\s*\\(ID:\\s*" + productId + "\\)";
            Matcher m2 = Pattern.compile(pattern2).matcher(result);
            if (m2.find()) {
                String replacement = buildProductCard(p);
                result = m2.replaceAll(Matcher.quoteReplacement(replacement));
                linkedProductIds.add(productId);
                continue;
            }

            // 3. 匹配纯商品名称
            if (!linkedProductIds.contains(productId)) {
                String checkPattern = "<a[^>]*>" + Pattern.quote(productName) + "</a>";
                if (!Pattern.compile(checkPattern).matcher(result).find() && result.contains(productName)) {
                    String replacement = buildProductCard(p);
                    result = result.replaceFirst(Pattern.quote(productName), Matcher.quoteReplacement(replacement));
                }
            }
        }

        return result;
    }

    private String buildProductCard(Product p) {
        String imageUrl = p.getImageUrl() != null ? p.getImageUrl() :
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='90'%3E%3Crect width='120' height='90' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%23999'%3ELenovo%3C/text%3E%3C/svg%3E";

        return String.format("""
            <div style='display: inline-block; width: 360px; margin: 15px 10px; padding: 18px; background: white; border: 2px solid #e60012; border-radius: 12px; box-shadow: 0 4px 12px rgba(230,0,18,0.15); vertical-align: top; transition: transform 0.3s;' onmouseover='this.style.transform="translateY(-5px)"' onmouseout='this.style.transform="translateY(0)"'>
                <img src='%s' style='width: 100%%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;'>
                <div style='font-size: 17px; font-weight: 600; color: #333; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'>%s</div>
                <div style='font-size: 14px; color: #666; margin-bottom: 10px;'>型号：%s</div>
                <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;'>
                    <span style='font-size: 26px; font-weight: bold; color: #e60012;'>¥%.2f</span>
                    <span style='font-size: 13px; color: #999;'>库存：%d</span>
                </div>
                <a href='/product.html?id=%d' style='display: block; text-align: center; padding: 12px; background: linear-gradient(135deg, #e60012 0%%, #c00010 100%%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;'>查看详情 →</a>
            </div>
            """, imageUrl, p.getName(), p.getModel(), p.getPrice(), p.getStock(), p.getId());
    }

    private String fallbackResponse(String userMessage) {
        List<Product> products = productRepository.findAll();
        String msg = userMessage.toLowerCase();

        if ((msg.contains("12700") && msg.contains("13700")) ||
                (msg.contains("对比") && msg.contains("处理器"))) {
            return """
                <div style='line-height: 1.8;'>
                <h3 style='color: #e60012;'>Intel 12700H vs 13700H 详细对比</h3>
                
                <strong>性能提升：</strong><br>
                • 单核性能：提升约 15-18%<br>
                • 多核性能：提升约 12-15%<br>
                • 能效比：提升约 10%<br><br>
                
                <strong>购买建议：</strong><br>
                如果价格差在500元以内，建议选13700H；如果差价超过1000元，12700H性价比更高。
                </div>
                """;
        }

        if (msg.contains("游戏") || msg.contains("打游戏")) {
            return buildGamingRecommendation(products);
        }

        if (msg.contains("大学生") || msg.contains("学生")) {
            return buildStudentRecommendation(products);
        }

        int budget = extractBudget(userMessage);
        if (budget > 0 || msg.contains("预算") || msg.contains("推荐")) {
            return buildBudgetRecommendation(products, budget);
        }

        return """
            <div style='line-height: 1.8;'>
            您好！我是联想笔记本专业导购AI 🎯<br><br>
            
            <strong>我可以帮您：</strong><br>
            ✓ 根据预算推荐最合适的笔记本<br>
            ✓ 详细对比处理器性能<br>
            ✓ 解答所有电脑硬件问题<br>
            ✓ 分析不同使用场景的配置需求<br><br>
            
            请告诉我您的需求，我会给您专业的建议！
            </div>
            """;
    }

    private String buildBudgetRecommendation(List<Product> products, int budget) {
        final int finalBudget = (budget <= 0) ? 8000 : budget;

        List<Product> suitable = products.stream()
                .filter(p -> p.getPrice().doubleValue() <= finalBudget * 1.2)
                .sorted(Comparator.comparing(p -> Math.abs(p.getPrice().doubleValue() - finalBudget)))
                .limit(3)
                .toList();

        if (suitable.isEmpty()) {
            suitable = products.stream()
                    .sorted(Comparator.comparing(Product::getPrice))
                    .limit(3)
                    .toList();
        }

        StringBuilder sb = new StringBuilder(String.format("""
        <div style='line-height: 1.8;'>
        <h3 style='color: #e60012;'>根据您¥%d的预算，为您推荐以下笔记本：</h3>
        <p style='color: #666; margin-bottom: 20px;'>
        已为您筛选出价格在¥%d - ¥%d之间的优质机型，性价比高，配置均衡。
        </p>
        """, finalBudget, (int)(finalBudget * 0.8), (int)(finalBudget * 1.2)));

        int rank = 1;
        for (Product p : suitable) {
            sb.append(String.format("""
            <div style='margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #e60012;'>
            <div style='display: flex; justify-content: space-between; align-items: start;'>
                <div style='flex: 1;'>
                    <span style='background: #e60012; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;'>推荐%d</span>
                    <a href='/product.html?id=%d' style='color: #e60012; font-size: 18px; font-weight: 600; text-decoration: none;'>%s</a>
                    <br><span style='color: #999; font-size: 14px;'>型号：%s</span>
                </div>
                <div style='text-align: right;'>
                    <div style='color: #e60012; font-size: 24px; font-weight: bold;'>¥%.2f</div>
                    <div style='color: #666; font-size: 12px;'>%s</div>
                </div>
            </div>
            <div style='margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;'>
            """, rank++, p.getId(), p.getName(), p.getModel(), p.getPrice(),
                    p.getPrice().doubleValue() < finalBudget ? "超值推荐" : "高配选择"));

            if (p.getCpu() != null)
                sb.append(String.format("<div style='margin: 4px 0;'>💻 <strong>处理器：</strong>%s</div>", p.getCpu()));
            if (p.getMemory() != null)
                sb.append(String.format("<div style='margin: 4px 0;'>🔧 <strong>内存：</strong>%s</div>", p.getMemory()));
            if (p.getStorage() != null)
                sb.append(String.format("<div style='margin: 4px 0;'>💾 <strong>存储：</strong>%s</div>", p.getStorage()));
            if (p.getGraphics() != null)
                sb.append(String.format("<div style='margin: 4px 0;'>🎮 <strong>显卡：</strong>%s</div>", p.getGraphics()));

            // 添加适用场景
            String scenario = "";
            if (p.getGraphics() != null && (p.getGraphics().contains("RTX") || p.getGraphics().contains("RX"))) {
                scenario = "适合游戏、设计、视频剪辑";
            } else if (p.getPrice().doubleValue() < 6000) {
                scenario = "适合日常办公、学习、轻度娱乐";
            } else {
                scenario = "适合商务办公、多任务处理";
            }

            sb.append(String.format("""
            </div>
            <div style='margin-top: 12px; padding: 8px; background: #fff3e0; border-radius: 4px; font-size: 13px;'>
                <strong>💡 推荐理由：</strong>%s
            </div>
            <a href='/product.html?id=%d' style='display: inline-block; margin-top: 12px; padding: 10px 20px; background: #e60012; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;'>查看详情 →</a>
            </div>
            """, scenario, p.getId()));
        }

        sb.append("""
        <div style='margin-top: 20px; padding: 15px; background: #f0f7ff; border-radius: 8px; border-left: 3px solid #667eea;'>
            <strong>💬 需要更多帮助？</strong><br>
            • 想了解具体配置差异？直接问我"对比这几款"<br>
            • 有特殊需求？告诉我"我主要用来XXX"<br>
            • 想看其他价位？说"推荐XXX元的笔记本"
        </div>
        </div>
        """);

        return sb.toString();
    }

    private String buildGamingRecommendation(List<Product> products) {
        List<Product> gaming = products.stream()
                .filter(p -> p.getGraphics() != null && (p.getGraphics().contains("RTX") || p.getGraphics().contains("RX")))
                .sorted(Comparator.comparing(Product::getPrice).reversed())
                .limit(3)
                .toList();

        if (gaming.isEmpty()) {
            return "<div style='line-height: 1.8;'><h3 style='color: #e60012;'>当前商城暂无游戏本，建议关注新品上架！</h3></div>";
        }

        StringBuilder sb = new StringBuilder("<div style='line-height: 1.8;'><h3 style='color: #e60012;'>游戏本推荐</h3>");
        gaming.forEach(p -> {
            sb.append(String.format(
                    "<div style='margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;'>" +
                            "<a href='/product.html?id=%d' style='color: #e60012; font-size: 18px; font-weight: 600;'>%s</a><br>" +
                            "¥%.2f<br>",
                    p.getId(), p.getName(), p.getPrice()));
            if (p.getCpu() != null) sb.append(String.format("处理器：%s<br>", p.getCpu()));
            if (p.getGraphics() != null) sb.append(String.format("显卡：%s<br>", p.getGraphics()));
            sb.append(String.format("<a href='/product.html?id=%d' style='display: inline-block; margin-top: 10px; padding: 8px 16px; background: #e60012; color: white; text-decoration: none; border-radius: 6px;'>查看详情</a>", p.getId()));
            sb.append("</div>");
        });
        sb.append("</div>");
        return sb.toString();
    }

    private String buildStudentRecommendation(List<Product> products) {
        List<Product> suitable = products.stream()
                .filter(p -> p.getPrice().doubleValue() >= 4000 && p.getPrice().doubleValue() <= 7000)
                .sorted(Comparator.comparing(Product::getPrice))
                .limit(3)
                .toList();

        if (suitable.isEmpty()) {
            suitable = products.stream()
                    .sorted(Comparator.comparing(Product::getPrice))
                    .limit(3)
                    .toList();
        }

        StringBuilder sb = new StringBuilder("<div style='line-height: 1.8;'><h3 style='color: #e60012;'>大学生笔记本推荐</h3>");
        suitable.forEach(p -> {
            sb.append(String.format(
                    "<div style='margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;'>" +
                            "<a href='/product.html?id=%d' style='color: #e60012; font-size: 18px; font-weight: 600;'>%s</a><br>" +
                            "¥%.2f<br>",
                    p.getId(), p.getName(), p.getPrice()));
            if (p.getCpu() != null) sb.append(String.format("处理器：%s<br>", p.getCpu()));
            sb.append(String.format("<a href='/product.html?id=%d' style='display: inline-block; margin-top: 10px; padding: 8px 16px; background: #e60012; color: white; text-decoration: none; border-radius: 6px;'>查看详情</a>", p.getId()));
            sb.append("</div>");
        });
        sb.append("</div>");
        return sb.toString();
    }

    private int extractBudget(String message) {
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\d{4,5}");
        java.util.regex.Matcher matcher = pattern.matcher(message);
        if (matcher.find()) {
            try {
                int num = Integer.parseInt(matcher.group());
                if (num >= 1000 && num <= 100000) return num;
            } catch (NumberFormatException ignored) {}
        }
        return 0;
    }
}