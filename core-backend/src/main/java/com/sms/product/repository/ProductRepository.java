package com.sms.product.repository;

import java.util.List;
import java.util.UUID;

import com.sms.product.dto.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    @Query("""
            select p from Product p left join p.category c left join p.brand b
            where :term is null or :term = ''
               or lower(p.name) like lower(concat('%', :term, '%'))
               or lower(p.code) like lower(concat('%', :term, '%'))
               or lower(c.name) like lower(concat('%', :term, '%'))
               or lower(b.name) like lower(concat('%', :term, '%'))
            order by p.name
            """)
    List<Product> search(@Param("term") String term);

    @Query(value = "select nextval('product_code_seq')", nativeQuery = true)
    long nextCodeSequence();
}
