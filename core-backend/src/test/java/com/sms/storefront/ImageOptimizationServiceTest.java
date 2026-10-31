package com.sms.storefront;

import static org.assertj.core.api.Assertions.assertThat;

import com.sms.storefront.service.ImageOptimizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ImageOptimizationServiceTest {

    private ImageOptimizationService imageOptimizationService;

    @BeforeEach
    void setUp() {
        imageOptimizationService = new ImageOptimizationService();
    }

    @Test
    void testUnsplashOptimization() {
        String raw = "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80";
        String card = imageOptimizationService.getPresetUrl(raw, ImageOptimizationService.ImagePreset.CARD);

        assertThat(card).contains("w=400");
        assertThat(card).contains("h=400");
        assertThat(card).contains("fm=webp");
        assertThat(card).contains("q=82");
    }

    @Test
    void testPresetThumbAndHero() {
        String raw = "https://images.unsplash.com/photo-test";
        String thumb = imageOptimizationService.getPresetUrl(raw, ImageOptimizationService.ImagePreset.THUMBNAIL);
        String hero = imageOptimizationService.getPresetUrl(raw, ImageOptimizationService.ImagePreset.HERO);

        assertThat(thumb).contains("w=150");
        assertThat(hero).contains("w=1000");
    }

    @Test
    void testGenerateResponsiveSet() {
        String raw = "https://images.unsplash.com/photo-test";
        ImageOptimizationService.ResponsiveImageSet set = imageOptimizationService.generateResponsiveSet(raw);

        assertThat(set.thumbnailUrl()).contains("w=150");
        assertThat(set.cardUrl()).contains("w=400");
        assertThat(set.heroUrl()).contains("w=1000");
        assertThat(set.srcSetWebp()).contains("150w");
        assertThat(set.srcSetWebp()).contains("400w");
        assertThat(set.srcSetWebp()).contains("1000w");
        assertThat(set.lqipDataUri()).startsWith("data:image/svg+xml;base64,");
        assertThat(set.preloadLinkHeader()).contains("rel=preload; as=image");
        assertThat(set.preloadHtmlTag()).startsWith("<link rel=\"preload\" as=\"image\"");
        assertThat(set.preloadHtmlTag()).contains("fetchpriority=\"high\"");
    }

    @Test
    void testGeneratePreloadHintsWithCustomSizes() {
        String raw = "https://images.unsplash.com/photo-banner";
        ImageOptimizationService.ResponsiveImageSet set = imageOptimizationService.generateResponsiveSet(raw);
        String customSizes = "100vw";

        String linkHeader = imageOptimizationService.generatePreloadLinkHeader(set.heroUrl(), set.srcSetWebp(), customSizes);
        String htmlTag = imageOptimizationService.generatePreloadHtmlTag(set.heroUrl(), set.srcSetWebp(), customSizes);

        assertThat(linkHeader).contains("imagesizes=\"100vw\"");
        assertThat(htmlTag).contains("imagesizes=\"100vw\"");
        assertThat(htmlTag).contains("type=\"image/webp\"");
    }

    @Test
    void testGenerateLqip() {
        String raw = "https://images.unsplash.com/photo-sofa";
        String lqip = imageOptimizationService.generateLqip(raw);

        assertThat(lqip).isNotBlank();
        assertThat(lqip).startsWith("data:image/svg+xml;base64,");
    }

    @Test
    void testNullOrBlankFallback() {
        String opt = imageOptimizationService.getPresetUrl(null, ImageOptimizationService.ImagePreset.CARD);
        assertThat(opt).isNotBlank();
        assertThat(opt).contains("w=400");
    }
}
