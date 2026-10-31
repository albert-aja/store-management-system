package com.sms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.time.Clock;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableScheduling
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class SmsBackendApplication {
	@Bean
	Clock applicationClock() {
		return Clock.systemUTC();
	}

	public static void main(String[] args) {
		SpringApplication.run(SmsBackendApplication.class, args);
	}

}
