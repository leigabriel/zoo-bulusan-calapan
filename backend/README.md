# Bulusan Zoo Backend

The backend of the Bulusan Zoo Management System is a Node.js and Express application that provides the REST API, database access, real-time communication, and background services used by the zoo's website and staff tools.

## Overview

The server is the single source of truth for zoo data. It manages users, reservations, tickets, payments, events, wildlife records, community content, messaging, notifications, and activity logs. It connects to a MySQL database, serves uploaded files, and exposes versioned feature routes for the visitor website, the administrative dashboard, and the staff dashboard.

The API is designed to run behind a reverse proxy and applies security headers, request rate limiting, origin validation, and role-based authorization on protected routes. Uploaded images and documents are stored through Cloudinary when it is configured, with local disk storage as a fallback.

## Authentication and Accounts

Authentication is token based. Users register and sign in with an email address and password, and the server issues signed access tokens that are validated on every protected request. Sessions can also be established through Google sign-in, which is handled by a dedicated authentication flow that redirects back to the website once the account is confirmed.

The system distinguishes three roles. Visitors manage their own profile, reservations, tickets, events, and messages. Staff members handle day-to-day operations such as scanning tickets, recording walk-in guests, moderating community posts, and assisting visitors. Administrators have full access, including user and staff management, payment and ticket configuration, analytics, reports, and system maintenance.

Account-related services include password handling, profile images, resident identification uploads for discounted reservations, account status checks, and token revocation so that a signed-out or disabled session cannot be reused.

## Reservations and Tickets

The reservation module handles bookings for individuals and groups. A reservation records the visit date, time slot, number of guests, guest categories, contact details, and any supporting identification required for local resident rates. Reservations move through a lifecycle of pending, confirmed, completed, cancelled, or archived, and each change is recorded for auditing.

Tickets are issued against confirmed reservations. Each ticket carries a unique identifier and a QR code that staff can scan at the entrance. The scanning endpoint validates the ticket, checks whether it has already been used, and marks it as redeemed. Tickets can be printed, downloaded, or displayed on a phone, and administrative tools can regenerate, void, or review them.

Walk-in guests are supported through a separate flow that registers visitors on site, computes the applicable rates, records the payment method, and issues a ticket without an online booking.

## Payments

Online payments are processed through PayMongo checkout sessions. The server creates a checkout session for a reservation or event registration, stores the reference against the record, and confirms the payment through the provider's webhook. Payment state is tracked separately from the reservation state so that failed or abandoned checkouts do not block a booking.

Ticket and event prices, guest category rates, and payment settings are configurable by administrators, so promotional or seasonal pricing can be adjusted without code changes.

## Wildlife, Plants, and Events

The zoo's living collection is managed as structured records. Animal entries hold names, species information, descriptions, images, and exhibit details. Plant entries hold similar botanical information and are grouped by collection. Both are exposed publicly for the website's wildlife pages and can be created, edited, archived, and restored by staff and administrators.

Events are published with schedules, venues, descriptions, capacity, fees, and images. Visitors can register for events, review their registrations, and receive confirmation. Staff and administrators manage event records, attendance, and payments.

An image-based prediction service supports the zoo's scanning features. Visitors can submit a photo and receive an identification result, while staff and administrators can review prediction history and statistics.

## Community and Messaging

The community module allows visitors to share posts and photos with moderation by staff and administrators. Posts can be reviewed, approved, hidden, or removed, and reported content is handled through the moderation queue.

Direct messaging between visitors and zoo staff runs over Socket.IO, giving real-time delivery and read status. The same channel powers live support conversations, and message history is retained so that conversations can be reviewed from the administrative dashboard.

## AI Assistant

Bulusan Zoo includes "Jiji", a visitor-facing AI assistant. The assistant is powered by Google's Gemini models and is constrained by a set of static instruction files that define its identity, factual standards, privacy rules, response formatting, website guidance, and animal and conservation knowledge. Live database content and the signed-in visitor's own reservation data are supplied as dynamic context, so answers stay relevant to the current zoo information without exposing other visitors' records.

## Notifications and Email

Transactional email is delivered through Nodemailer using the configured SMTP provider. Messages cover account verification, password recovery, reservation confirmations, ticket delivery, event updates, and administrative notices. Notifications are also stored in the database so they can be displayed in the application.

## Monitoring, Reports, and Maintenance

Activity tracking records meaningful actions taken by visitors and staff, including sign-ins, reservation changes, ticket scans, uploads, and predictions. Administrators can review these logs, monitor staff activity, and inspect usage statistics.

Analytics endpoints aggregate reservation, ticket, payment, and visitor data for dashboards and reports. Reports can be filtered by date range and exported for offline use.

Maintenance features include soft deletion with a recycle bin for supported records, schema checks that run at startup to ensure required tables and columns exist, and health endpoints used by deployment platforms and uptime monitors.

## Data and Storage

Persistent data lives in MySQL. The application uses parameterized queries through the MySQL driver, keeps model logic in dedicated modules, and runs startup checks that add missing schema elements without destroying existing data. Administrator-managed payment and reservation settings are stored in the database as well, so a saved change survives server restarts and redeploys.

Uploaded files are handled by a dedicated upload service. When Cloudinary credentials are present, images are stored in the cloud; otherwise the server keeps them in a local uploads directory and serves them statically. File type and size limits are enforced on every upload route.

## Security

Protected routes require a valid token and, where relevant, a specific role. Passwords are hashed before storage, tokens can be revoked, and sensitive configuration is read from environment variables rather than source code. The server applies strict security headers, restricts allowed origins, limits request rates on authentication and public endpoints, validates and sanitizes incoming input, and returns consistent error responses that avoid leaking internal details.

Secrets, database credentials, and provider keys are never stored in the repository. The environment example file documents the required variable names without real values.
