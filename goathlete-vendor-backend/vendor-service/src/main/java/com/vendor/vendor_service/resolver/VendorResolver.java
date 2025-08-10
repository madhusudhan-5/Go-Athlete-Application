package com.vendor.vendor_service.resolver;

import graphql.kickstart.tools.GraphQLQueryResolver;
import graphql.kickstart.tools.GraphQLMutationResolver;
import com.vendor.vendor_service.dto.VendorInput;
import com.vendor.vendor_service.entity.Vendor;
import com.vendor.vendor_service.service.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class VendorResolver implements GraphQLQueryResolver, GraphQLMutationResolver {

    private final VendorService vendorService;

    public Vendor registerVendor(VendorInput input) {
        return vendorService.register(input);
    }

    public Vendor getVendorById(Long id) {
        return vendorService.getVendorById(id);
    }

    public List<Vendor> allVendors() {
        return vendorService.getAllVendors();
    }
}
