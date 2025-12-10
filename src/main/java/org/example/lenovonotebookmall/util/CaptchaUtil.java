package org.example.lenovonotebookmall.util;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Random;

public class CaptchaUtil {
    private static final int WIDTH = 120;
    private static final int HEIGHT = 40;
    private static final String CODES = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    
    public static CaptchaResult generate() {
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        
        Random random = new Random();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, WIDTH, HEIGHT);
        
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 4; i++) {
            String ch = String.valueOf(CODES.charAt(random.nextInt(CODES.length())));
            code.append(ch);
            g.setColor(new Color(random.nextInt(255), random.nextInt(255), random.nextInt(255)));
            g.setFont(new Font("Arial", Font.BOLD, 28));
            g.drawString(ch, 20 + i * 25, 28);
        }
        
        for (int i = 0; i < 5; i++) {
            g.setColor(new Color(random.nextInt(255), random.nextInt(255), random.nextInt(255)));
            g.drawLine(random.nextInt(WIDTH), random.nextInt(HEIGHT), 
                       random.nextInt(WIDTH), random.nextInt(HEIGHT));
        }
        
        g.dispose();
        
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());
            return new CaptchaResult(code.toString(), "data:image/png;base64," + base64);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
    
    public static class CaptchaResult {
        public String code;
        public String image;
        
        public CaptchaResult(String code, String image) {
            this.code = code;
            this.image = image;
        }
    }
}