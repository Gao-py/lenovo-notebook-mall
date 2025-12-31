package org.example.lenovonotebookmall.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CommentResponse {
    private Long id;
    private Long productId;
    private Long userId;
    private String username;
    private String avatar;
    private String content;
    private Long parentId;
    private Integer rating;
    private LocalDateTime createTime;
    private List<CommentResponse> replies;
    private Long likeCount;
    private Boolean isLiked;
}