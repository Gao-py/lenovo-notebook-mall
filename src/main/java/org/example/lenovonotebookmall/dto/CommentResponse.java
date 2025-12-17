package org.example.lenovonotebookmall.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentResponse {
    private Long id;
    private Long productId;
    private Long userId;
    private String username;
    private String content;
    private Long parentId;
    private LocalDateTime createTime;
}