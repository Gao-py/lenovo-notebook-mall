package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.CommentRequest;
import org.example.lenovonotebookmall.dto.CommentResponse;
import org.example.lenovonotebookmall.entity.ProductComment;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.ProductCommentRepository;
import org.example.lenovonotebookmall.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductCommentService {
    private final ProductCommentRepository commentRepository;
    private final UserRepository userRepository;
    
    public void addComment(Long userId, CommentRequest request) {
        ProductComment comment = new ProductComment();
        comment.setProductId(request.getProductId());
        comment.setUserId(userId);
        comment.setContent(request.getContent());
        comment.setParentId(request.getParentId());
        commentRepository.save(comment);
    }
    
    public List<CommentResponse> getCommentsByProductId(Long productId) {
        List<ProductComment> comments = commentRepository.findByProductIdOrderByCreateTimeDesc(productId);
        return comments.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    private CommentResponse toResponse(ProductComment comment) {
        CommentResponse response = new CommentResponse();
        response.setId(comment.getId());
        response.setProductId(comment.getProductId());
        response.setUserId(comment.getUserId());
        response.setContent(comment.getContent());
        response.setParentId(comment.getParentId());
        response.setCreateTime(comment.getCreateTime());
        
        userRepository.findById(comment.getUserId())
            .ifPresent(user -> response.setUsername(user.getUsername()));
        
        return response;
    }
}