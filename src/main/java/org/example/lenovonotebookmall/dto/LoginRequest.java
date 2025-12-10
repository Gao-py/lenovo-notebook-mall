package org.example.lenovonotebookmall.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
    private String captchaKey;
    private String captchaCode;
}