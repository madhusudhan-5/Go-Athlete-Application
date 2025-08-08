package com.vendor.vendor_service.entity;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "vendors")
@Data
public class Vendor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long vendorId;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String phone;

    private String passwordHash;

    private String businessType; // VENUE, ECOMMERCE, BOTH

    private boolean verified;

    private String status; // ACTIVE, INACTIVE, BLOCKED
}
