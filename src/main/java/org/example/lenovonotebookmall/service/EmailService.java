package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();
    private final Map<String, Long> codeExpiry = new ConcurrentHashMap<>();
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendVerificationCode(String email) {
        String code = generateCode();
        verificationCodes.put(email, code);
        codeExpiry.put(email, System.currentTimeMillis() + 300000);
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("联想笔记本商城 - 邮箱验证码");
        message.setText("您的验证码是：" + code + "\n\n验证码5分钟内有效，请勿泄露给他人。");
        
        mailSender.send(message);
    }
    
    public boolean verifyCode(String email, String code) {
        Long expiry = codeExpiry.get(email);
        if (expiry == null || System.currentTimeMillis() > expiry) {
            verificationCodes.remove(email);
            codeExpiry.remove(email);
            return false;
        }
        
        String storedCode = verificationCodes.get(email);
        if (storedCode != null && storedCode.equals(code)) {
            verificationCodes.remove(email);
            codeExpiry.remove(email);
            return true;
        }
        return false;
    }
    
    private String generateCode() {
        return String.format("%06d", new Random().nextInt(1000000));
    }
}