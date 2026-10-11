package com.sms.customer;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    boolean existsByNik(String nik);

    Optional<Customer> findByNik(String nik);

    @Query("""
            select c from Customer c
            where lower(c.fullName) like lower(concat('%', :term, '%'))
               or c.nik like concat('%', :term, '%')
               or c.primaryPhone like concat('%', :term, '%')
            order by c.fullName
            """)
    List<Customer> search(@Param("term") String term);
}
