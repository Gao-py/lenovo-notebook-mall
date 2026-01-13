package org.example.lenovonotebookmall.repository;

import org.example.lenovonotebookmall.entity.OrderRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRatingRepository extends JpaRepository<OrderRating, Long> {
    Optional<OrderRating> findByOrderItemId(Long orderItemId);

    @Query("SELECT r FROM OrderRating r WHERE r.orderItem.order.id = ?1")
    List<OrderRating> findByOrderId(Long orderId);

    @Query("SELECT r FROM OrderRating r JOIN r.orderItem oi WHERE oi.product.id = ?1")
    List<OrderRating> findByProductId(Long productId);
}