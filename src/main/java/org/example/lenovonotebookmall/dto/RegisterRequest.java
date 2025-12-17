package org.example.lenovonotebookmall.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String phone;
    private String verificationCode;
}