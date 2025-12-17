package org.example.lenovonotebookmall.dto;

import lombok.Data;

@Data
public class CommentRequest {
    private Long productId;
    private String content;
    private Long parentId; // 回复评论时传入父评论ID
}