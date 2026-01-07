package org.example.lenovonotebookmall;

import lombok.RequiredArgsConstructor;
import org.example.lenovonotebookmall.entity.Coupon;
import org.example.lenovonotebookmall.repository.CouponRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.math.BigDecimal;

@SpringBootApplication
@RequiredArgsConstructor
public class LenovoNotebookMallApplication {

    public static void main(String[] args) {
        SpringApplication.run(LenovoNotebookMallApplication.class, args);
    }

    @Bean
    CommandLineRunner initCoupons(CouponRepository couponRepository) {
        return args -> {
            if (couponRepository.count() == 0) {
                Coupon c1 = new Coupon();
                c1.setName("9折优惠券");
                c1.setType(Coupon.CouponType.DISCOUNT);
                c1.setDiscountPercent(BigDecimal.valueOf(90));
                c1.setPointsCost(500);
                couponRepository.save(c1);

                Coupon c2 = new Coupon();
                c2.setName("100元代金券");
                c2.setType(Coupon.CouponType.CASH);
                c2.setDiscountAmount(BigDecimal.valueOf(100));
                c2.setPointsCost(800);
                couponRepository.save(c2);

                Coupon c3 = new Coupon();
                c3.setName("满1000减200");
                c3.setType(Coupon.CouponType.FULL_REDUCTION);
                c3.setMinAmount(BigDecimal.valueOf(1000));
                c3.setDiscountAmount(BigDecimal.valueOf(200));
                c3.setPointsCost(1200);
                couponRepository.save(c3);
            }
        };
    }
}