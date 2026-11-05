# Bulusan Zoo Frontend

The frontend of the Bulusan Zoo Management System is a React single-page application built with Vite and styled with Tailwind CSS. It serves the public zoo website, the visitor account area, the administrative dashboard, and the staff dashboard from one codebase, selecting the appropriate experience based on the signed-in user's role.

## Overview

The application is organized around routes rather than separate sites. Visitors browse the public pages without signing in, while authenticated visitors, staff, and administrators are routed to their own areas after login. Layouts, navigation, and permissions adapt to the active role, and access to restricted routes is guarded on the client while the backend enforces the same rules independently.

State is handled with React context and hooks for authentication, session, notifications, and shared interface behavior. Server data is retrieved through a centralized service layer that attaches credentials, normalizes responses, and surfaces errors in a consistent way. Real-time features use a Socket.IO client connection.

## Public Website

The public experience introduces the zoo and its work. The home page presents the destination, highlights, and calls to action. Dedicated pages cover the zoo's story and commitment, the animal collection, the plant collection, the park map, upcoming events, and the community feed. Collection entries open into detail views with images and descriptive information, and wildlife entries link to their origin and habitat context.

The site includes an interactive map for locating exhibits and facilities, a help center with answers to common visitor questions, and the legal pages covering the privacy policy, cookie policy, refund policy, and terms of service. A floating AI assistant is available throughout the public pages for visitor questions.

The application is installable as a progressive web app. It registers a service worker, provides an app manifest and icons, and includes robots and sitemap files for search engines. Motion, scroll, and 3D presentation are used selectively to make the public pages feel lively without compromising readability.

## Accounts

Visitors can register, sign in with an email address and password, recover a forgotten password, and sign in with Google. The account area includes a profile page, account settings, a public profile view, and controls for updating personal details and images. Sessions are stored securely on the client and cleared on sign out, and expired or revoked sessions return the visitor to the sign-in page.

## Reservations, Tickets, and Events

The reservation flow guides a visitor through selecting a visit date, time slot, and guest breakdown, entering contact and identification details, and completing payment. Visitors can review their active reservations, download or display their tickets with QR codes, and browse archived reservations from previous visits.

The events area lists upcoming zoo events and opens each event into a detail view with schedule, venue, fees, and registration. Visitors can register, pay where required, and review their event registrations from a personal page.

## Community and Messaging

The community page lets visitors share posts and photos and interact with other visitors' content. Signed-in visitors can manage their own posts, while moderation tools are available to staff and administrators.

Messaging provides direct conversations between visitors and zoo staff, including a support thread. Conversations update in real time, show delivery and read state, and remain available in the visitor's message area.

## Administrative Dashboard

The administrative area is the operational center of the zoo. It provides dashboards with summary metrics and charts, reservation and ticket management, transaction and payment review, event and collection management, user and staff administration, community moderation, message handling, activity logs, analytics, and reports.

Administrators can configure ticket and event pricing, review payment records, monitor staff activity, restore or permanently remove items from the recycle bin, manage site settings, and export reports. The dashboard uses charting and spreadsheet libraries to present and download operational data.

## Staff Dashboard

The staff area focuses on front-line work. Staff can scan and validate ticket QR codes, register walk-in guests, review walk-in records, manage reservations and tickets for the current day, update animal and plant records, moderate community content, respond to visitor messages, and view event details. The staff experience is streamlined for quick use on tablets and phones during operating hours.

## AI Assistant

The AI assistant, Deera, appears as an embedded companion in the visitor, staff, and administrative areas. In the visitor experience it answers questions about the zoo, visits, reservations, events, payments, animals, and conservation. In the staff and administrative areas it acts as a role-aware companion that helps with operational questions. The assistant streams responses, keeps conversation history, and respects the permissions of the signed-in role.

## Interface and Experience

The interface follows a consistent visual language built on shared layout, navigation, card, form, table, dialog, and notification components. It supports responsive layouts for phones, tablets, and desktops, keyboard navigation, visible focus states, labeled form controls, and readable contrast. Loading, empty, error, disabled, and success states are handled throughout so that users always understand what the application is doing.

Animations and transitions are used to clarify state changes rather than to decorate. Charts, tables, maps, calendars, and QR displays are styled to match the rest of the product, and long lists are paginated or filtered to stay responsive.
