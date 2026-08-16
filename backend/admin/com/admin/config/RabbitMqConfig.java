package com.admin.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.amqp.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    public static final String NOTIFICATIONS_EXCHANGE = "nexora.notifications.exchange";
    public static final String NOTIFICATIONS_QUEUE = "nexora.notifications.queue";
    public static final String NOTIFICATIONS_DLQ = "nexora.notifications.dlq";
    public static final String NOTIFICATIONS_DLQ_EXCHANGE = "nexora.notifications.dlq.exchange";

    // Routing keys
    public static final String ROUTING_KEY_NOTIFICATION_USER = "notification.user";
    public static final String ROUTING_KEY_NOTIFICATION_PROJECT = "notification.project";
    public static final String ROUTING_KEY_NOTIFICATION_TASK = "notification.task";
    public static final String ROUTING_KEY_NOTIFICATION_TICKET = "notification.ticket";
    public static final String ROUTING_KEY_NOTIFICATION_TIMESHEET = "notification.timesheet";
    public static final String ROUTING_KEY_NOTIFICATION_CHAT = "notification.chat";
    public static final String ROUTING_KEY_NOTIFICATION_SYSTEM = "notification.system";

    @Value("${spring.rabbitmq.host:localhost}")
    private String rabbitHost;

    @Value("${spring.rabbitmq.port:5672}")
    private int rabbitPort;

    @Value("${spring.rabbitmq.username:guest}")
    private String rabbitUsername;

    @Value("${spring.rabbitmq.password:guest}")
    private String rabbitPassword;

    @Value("${spring.rabbitmq.virtual-host:/}")
    private String rabbitVhost;

    @Bean
    public MessageConverter rabbitMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter rabbitMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(rabbitMessageConverter);
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            MessageConverter rabbitMessageConverter
    ) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setMessageConverter(rabbitMessageConverter);
        return factory;
    }

    // Main topic exchange for notifications
    @Bean
    public TopicExchange notificationsExchange() {
        return new TopicExchange(NOTIFICATIONS_EXCHANGE, true, false);
    }

    // Main notifications queue
    @Bean
    public Queue notificationsQueue() {
        return QueueBuilder.durable(NOTIFICATIONS_QUEUE)
            .deadLetterExchange(NOTIFICATIONS_DLQ_EXCHANGE)
            .deadLetterRoutingKey("dlq.notification.*")
            .ttl(86400000) // 24 hours
            .build();
    }

    // Binding for all notification events to main queue
    @Bean
    public Binding notificationsBinding(Queue notificationsQueue, TopicExchange notificationsExchange) {
        return BindingBuilder.bind(notificationsQueue)
            .to(notificationsExchange)
            .with("notification.*");
    }

    // Dead letter queue for failed messages
    @Bean
    public TopicExchange notificationsDlqExchange() {
        return new TopicExchange(NOTIFICATIONS_DLQ_EXCHANGE, true, false);
    }

    @Bean
    public Queue notificationsDlq() {
        return QueueBuilder.durable(NOTIFICATIONS_DLQ)
            .ttl(604800000) // 7 days
            .build();
    }

    @Bean
    public Binding notificationsDlqBinding(Queue notificationsDlq, TopicExchange notificationsDlqExchange) {
        return BindingBuilder.bind(notificationsDlq)
            .to(notificationsDlqExchange)
            .with("dlq.notification.*");
    }
}
