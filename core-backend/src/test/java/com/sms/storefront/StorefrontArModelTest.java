package com.sms.storefront;

import com.sms.product.dto.Product;
import com.sms.product.dto.ProductCategory;
import com.sms.storefront.dto.ArModelDto;
import com.sms.storefront.service.StorefrontCatalogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StorefrontArModelTest {

    private StorefrontCatalogService catalogService;

    @BeforeEach
    void setUp() {
        catalogService = new StorefrontCatalogService(null, null, null, null, null, null, null);
    }

    @Test
    @DisplayName("Should populate 3D / AR model for Sofa in Furniture category")
    void testResolveArModelForSofa() {
        ProductCategory furnitureCat = new ProductCategory();
        furnitureCat.setName("Furniture & Living");

        Product sofa = new Product();
        sofa.setName("Sofa Bed L-Shape Scandinavian 3 Seater");
        sofa.setCode("FURN-SOFA-01");
        sofa.setCategory(furnitureCat);

        ArModelDto arModel = catalogService.resolveArModel(sofa);

        assertThat(arModel.isSupported()).isTrue();
        assertThat(arModel.furnitureType()).isEqualTo("SOFA");
        assertThat(arModel.widthCm()).isEqualTo(210);
        assertThat(arModel.depthCm()).isEqualTo(90);
        assertThat(arModel.heightCm()).isEqualTo(85);
        assertThat(arModel.recommendedRoom()).isEqualTo("LIVING_ROOM");
        assertThat(arModel.colorVariants()).isNotEmpty();
        assertThat(arModel.hotspots()).isNotEmpty();
        assertThat(arModel.modelGlbUrl()).isNotBlank();
        assertThat(arModel.modelUsdzUrl()).isNotBlank();
    }

    @Test
    @DisplayName("Should populate 3D / AR model for Wardrobe / Lemari")
    void testResolveArModelForWardrobe() {
        ProductCategory furnitureCat = new ProductCategory();
        furnitureCat.setName("Mebel & Lemari");

        Product wardrobe = new Product();
        wardrobe.setName("Lemari Pakaian Minimalis 2 Pintu Sliding Modern");
        wardrobe.setCode("FURN-LMR-02");
        wardrobe.setCategory(furnitureCat);

        ArModelDto arModel = catalogService.resolveArModel(wardrobe);

        assertThat(arModel.isSupported()).isTrue();
        assertThat(arModel.furnitureType()).isEqualTo("WARDROBE");
        assertThat(arModel.widthCm()).isEqualTo(120);
        assertThat(arModel.heightCm()).isEqualTo(200);
        assertThat(arModel.recommendedRoom()).isEqualTo("BEDROOM");
        assertThat(arModel.hotspots()).anyMatch(h -> h.title().contains("Soft-Close"));
    }

    @Test
    @DisplayName("Should populate 3D / AR model for Dining Set")
    void testResolveArModelForDiningSet() {
        ProductCategory furnitureCat = new ProductCategory();
        furnitureCat.setName("Furniture Ruang Makan");

        Product dining = new Product();
        dining.setName("Set Meja Makan Marmer 6 Kursi Modern Dining");
        dining.setCode("FURN-MM-03");
        dining.setCategory(furnitureCat);

        ArModelDto arModel = catalogService.resolveArModel(dining);

        assertThat(arModel.isSupported()).isTrue();
        assertThat(arModel.furnitureType()).isEqualTo("DINING_SET");
        assertThat(arModel.widthCm()).isEqualTo(160);
        assertThat(arModel.depthCm()).isEqualTo(90);
        assertThat(arModel.recommendedRoom()).isEqualTo("DINING_ROOM");
    }

    @Test
    @DisplayName("Should return unsupported for non-furniture electronics product")
    void testResolveArModelForElectronics() {
        ProductCategory elecCat = new ProductCategory();
        elecCat.setName("Elektronik & Audio");

        Product tv = new Product();
        tv.setName("Smart TV 55 Inch 4K UHD");
        tv.setCode("ELEC-TV-55");
        tv.setCategory(elecCat);

        ArModelDto arModel = catalogService.resolveArModel(tv);

        assertThat(arModel.isSupported()).isFalse();
        assertThat(arModel.furnitureType()).isNull();
        assertThat(arModel.modelGlbUrl()).isNull();
    }
}
