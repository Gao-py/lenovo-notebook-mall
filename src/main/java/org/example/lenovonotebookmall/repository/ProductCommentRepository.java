package org.example.lenovonotebookmall.repository;

import org.example.lenovonotebookmall.entity.ProductComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductCommentRepository extends JpaRepository<ProductComment, Long> {
    @Query("SELECT c FROM ProductComment c WHERE c.productId = ?1 ORDER BY c.createTime DESC")
    List<ProductComment> findByProductIdOrderByCreateTimeDesc(Long productId);
}