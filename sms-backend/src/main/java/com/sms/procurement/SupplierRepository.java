package com.sms.procurement;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    boolean existsByCode(String code);

    @Query("""
            select s from Supplier s
            where lower(s.name) like lower(concat('%', :term, '%'))
               or lower(s.code) like lower(concat('%', :term, '%'))
            order by s.name
            """)
    List<Supplier> search(@Param("term") String term);
}
