package org.example.lenovonotebookmall.service;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.dto.CommentRequest;
import org.example.lenovonotebookmall.dto.CommentResponse;
import org.example.lenovonotebookmall.entity.OrderRating;
import org.example.lenovonotebookmall.entity.ProductComment;
import org.example.lenovonotebookmall.entity.User;
import org.example.lenovonotebookmall.repository.OrderRatingRepository;
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
    private final OrderRatingRepository orderRatingRepository;

    public void addComment(Long userId, CommentRequest request) {
        if (request.getParentId() == null) {
            throw new RuntimeException("只能回复评价，不能直接发表评论");
        }

        ProductComment comment = new ProductComment();
        comment.setProductId(request.getProductId());
        comment.setUserId(userId);
        comment.setContent(request.getContent());
        comment.setParentId(request.getParentId());
        commentRepository.save(comment);
    }
    
    public List<CommentResponse> getCommentsByProductId(Long productId) {
        List<OrderRating> ratings = orderRatingRepository.findByProductId(productId).stream()
            .filter(r -> r.getComment() != null && !r.getComment().trim().isEmpty())
            .filter(r -> r.getOrderItem() != null && r.getOrderItem().getOrder() != null && r.getOrderItem().getOrder().getUser() != null)
            .collect(Collectors.toList());

        List<ProductComment> allReplies = commentRepository.findByProductIdOrderByCreateTimeDesc(productId);

        return ratings.stream().map(rating -> {
            CommentResponse response = new CommentResponse();
            response.setId(rating.getId());
            response.setProductId(productId);

            User user = rating.getOrderItem().getOrder().getUser();
            response.setUserId(user.getId());
            response.setContent(rating.getComment());
            response.setCreateTime(rating.getCreateTime());
            response.setUsername(user.getUsername());
            response.setAvatar(user.getAvatar());
            response.setRating(rating.getRating());

            response.setReplies(buildReplyTree(rating.getId(), allReplies));
            return response;
        }).collect(Collectors.toList());
    }

    private List<CommentResponse> buildReplyTree(Long parentId, List<ProductComment> allReplies) {
        return allReplies.stream()
            .filter(r -> r.getParentId() != null && r.getParentId().equals(parentId))
            .map(r -> {
                CommentResponse reply = new CommentResponse();
                reply.setId(r.getId());
                reply.setContent(r.getContent());
                reply.setCreateTime(r.getCreateTime());
                reply.setParentId(r.getParentId());

                User replyUser = userRepository.findById(r.getUserId()).orElse(null);
                if (replyUser != null) {
                    reply.setUsername(replyUser.getUsername());
                    reply.setAvatar(replyUser.getAvatar());
                }

                reply.setReplies(buildReplyTree(r.getId(), allReplies));
                return reply;
            })
            .collect(Collectors.toList());
    }
}