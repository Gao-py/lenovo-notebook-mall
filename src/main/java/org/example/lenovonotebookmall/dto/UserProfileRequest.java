package org.example.lenovonotebookmall.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserProfileRequest {
    private String nickname;
    private String avatar;
    private LocalDate birthday;
    private String gender;
    private String phone;
    private String address;
    private String signature;
}