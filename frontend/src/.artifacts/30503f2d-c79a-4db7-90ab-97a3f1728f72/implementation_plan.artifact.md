# Refine User Notifications with React-Toastify

This plan aims to modernize and polish all user-facing notifications across the application using `react-toastify`.

## Proposed Changes

### [Utility] [toast.js](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/utils/toast.js)

- Refine `friendlyMessage` to provide shorter, more natural, and contextual messages.
- Standardize mapping of technical error strings to user-friendly messages.
- Ensure `notify` methods are consistent.

### [Admin Pages]

Refine messages and add missing success notifications for CRUD operations.

#### [MODIFY] [AdminAnimals.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/admin/AdminAnimals.jsx)
- Add `notify.success` for save and delete.
- Refine error messages.

#### [MODIFY] [AdminPlants.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/admin/AdminPlants.jsx)
- Add `notify.success` for save and delete.
- Refine error messages.

#### [MODIFY] [AdminUsers.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/admin/AdminUsers.jsx)
- Add `notify.success` for create, update, suspend, and unsuspend.
- Refine error messages.

#### [MODIFY] [AdminEvents.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/admin/AdminEvents.jsx)
- Replace local `error` state usage for actions with `notify`.
- Add success notifications.

#### [MODIFY] [AdminTickets.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/admin/AdminTickets.jsx)
- Refine existing `notify` messages.

### [Staff Pages]

#### [MODIFY] [StaffAnimals.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/staff/StaffAnimals.jsx)
- Add success notifications.
- Refine error messages.

#### [MODIFY] [StaffPlants.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/staff/StaffPlants.jsx)
- Add success notifications.
- Refine error messages.

#### [MODIFY] [QRScanner.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/staff/QRScanner.jsx)
- Refine feedback messages (e.g., "Valid ticket detected!" -> "Ticket verified.").

### [Auth Pages]

#### [MODIFY] [LoginPage.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/auth/LoginPage.jsx)
- Refine "Login successful" -> "Welcome back."
- Refine login failure messages.

#### [MODIFY] [RegisterPage.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/auth/RegisterPage.jsx)
- Refine registration success messages.

### [User Pages]

#### [MODIFY] [UserProfile.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/user/UserProfile.jsx)
- Refine profile update messages.

#### [MODIFY] [Reservations.jsx](file:///C:/laragon/www/GitHub/zoo-bulusan-calapan/frontend/src/pages/user/Reservations.jsx)
- Refine validation warnings and success messages.

## Verification Plan

### Automated Tests
- N/A (Project doesn't seem to have a test suite set up for UI notifications).

### Manual Verification
1.  Perform login/registration and verify new toast messages.
2.  Update a user profile and check the success notification.
3.  As an admin/staff, create, update, and delete an animal/plant/user and verify the notifications.
4.  Scan a ticket (if possible in dev environment) and check the feedback.
5.  Trigger various error conditions (e.g., empty fields, network failure) and verify the refined error messages.
