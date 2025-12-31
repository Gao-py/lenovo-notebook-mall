package org.example.lenovonotebookmall.dto;

import lombok.Data;

@Data
public class RatingRequest {
    private Long orderItemId;
    private Integer rating;
    private String comment;
    private String images;
}