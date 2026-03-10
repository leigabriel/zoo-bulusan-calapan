# zoo bulusan calapan – technical and functional analysis report

## table of contents

1. current system features
2. system architecture overview
3. current limitations and weaknesses
4. improvements to implement
5. engagement and client-value suggestions
6. strategic growth suggestions

---

# 1. current system features

## 1.1 features by user role

| role   | feature                  | description                                                          |
| ------ | ------------------------ | -------------------------------------------------------------------- |
| public | home page                | landing page with zoo information, featured animals, upcoming events |
| public | animals gallery          | browse all zoo animals with search and filtering                     |
| public | plants gallery           | browse botanical collection                                          |
| public | events listing           | view upcoming zoo events                                             |
| public | animaldex                | ai-powered animal classification scanner                             |
| public | ai chat assistant        | "zooey" chatbot powered by google generative ai                      |
| public | mini zoo game            | 3d interactive game using three.js                                   |
| user   | registration             | email-based registration with smtp verification                      |
| user   | google oauth             | social login integration                                             |
| user   | profile management       | update profile info, upload profile image                            |
| user   | ticket reservations      | book zoo visit tickets with date and time selection                  |
| user   | event reservations       | register for special zoo events                                      |
| user   | my collection            | personal collection of scanned or discovered animals                 |
| user   | reservation history      | view past and upcoming reservations                                  |
| user   | messages                 | contact admin or support messaging                                   |
| user   | notifications            | system notifications for bookings and events                         |
| staff  | dashboard                | activity summary and today's statistics                              |
| staff  | ticket scanner           | qr code scanner for ticket validation                                |
| staff  | ticket management        | view and process ticket reservations                                 |
| staff  | event check-in           | validate event attendees                                             |
| staff  | activity logs            | track staff actions                                                  |
| admin  | dashboard                | analytics overview with charts                                       |
| admin  | user management          | create, read, update, delete operations on users                     |
| admin  | animal management        | add, edit, delete zoo animals                                        |
| admin  | plant management         | manage botanical collection                                          |
| admin  | event management         | create and manage zoo events                                         |
| admin  | reservation management   | view, approve, reject reservations                                   |
| admin  | reports                  | generate sales, visitor, and event reports with excel export         |
| admin  | messages and help center | respond to user inquiries                                            |
| admin  | staff management         | manage staff accounts and permissions                                |

---

## 1.2 authentication flow

user entry
→ register (bcryptjs password hashing)
→ email verification through smtp

alternative path
user entry
→ google oauth login

after verification or oauth login
→ jwt token generation
→ role-based redirect

redirect destinations
admin → admin dashboard
staff → staff dashboard
user → user home

---

## 1.3 role-based access control

| route pattern                     | public | user | staff | admin |
| --------------------------------- | ------ | ---- | ----- | ----- |
| `/` home                          | yes    | yes  | yes   | yes   |
| `/animals` `/plants` `/events`    | yes    | yes  | yes   | yes   |
| `/animal-dex` `/ai-assistant`     | yes    | yes  | yes   | yes   |
| `/user/*` profile and collections | no     | yes  | no    | no    |
| `/reservations`                   | no     | yes  | no    | no    |
| `/staff/*`                        | no     | no   | yes   | yes   |
| `/admin/*`                        | no     | no   | no    | yes   |

---

## 1.4 database structure

| table               | purpose               | key fields                                                 |
| ------------------- | --------------------- | ---------------------------------------------------------- |
| users               | user accounts         | id, name, email, password_hash, role, email_verified       |
| animals             | zoo animal records    | id, name, species, category, image_url, description        |
| plants              | botanical collection  | id, name, scientific_name, description, image_url          |
| events              | zoo events            | id, title, description, event_date, ticket_price, capacity |
| tickets             | ticket types          | id, type, price, description                               |
| ticket_reservations | visit bookings        | id, user_id, ticket_id, visit_date, status, qr_code        |
| event_reservations  | event registrations   | id, user_id, event_id, status                              |
| user_collections    | scanned animals       | id, user_id, animal_id, discovered_at                      |
| predictions         | ai scan history       | id, user_id, animal_id, confidence, image_url              |
| user_messages       | support messages      | id, user_id, subject, message, admin_reply                 |
| notifications       | user notifications    | id, user_id, title, message, is_read                       |
| staff_activity_logs | staff actions         | id, staff_id, action, details, timestamp                   |
| staff_sessions      | active staff sessions | id, staff_id, login_time, logout_time                      |
| user_appeals        | account appeals       | id, user_id, appeal_type, reason, status                   |

---

## 1.5 ai integration workflow

user scans animal through camera or image upload
→ image sent to tensorflow.js model
→ prediction among 15 supported animal classes

supported animals
bengal tiger, carabao, crocodile, deer, eagle, elephant, giraffe, horse, lion, monkey, ostrich, peacock, tarsier, tortoise, zebra

confidence handling

| confidence level | action                                 |
| ---------------- | -------------------------------------- |
| ≥ 70 percent     | automatically added to user collection |
| < 70 percent     | prompt user to retry scan              |

---

## 1.6 email smtp integration

email verification

* six-digit otp during registration
* expires after 10 minutes
* required before account activation

password reset

* not yet implemented
* planned feature

reservation confirmations

* ticket booking confirmations
* qr code delivery

event notifications

* event reminders
* reservation status updates

configuration
nodemailer with configurable smtp provider such as gmail or custom smtp server.

---

# 2. system architecture overview

## 2.1 frontend architecture

| layer            | technology                   | version | purpose                         |
| ---------------- | ---------------------------- | ------- | ------------------------------- |
| framework        | react                        | 19.1.1  | ui component system             |
| build tool       | vite                         | 7.1.2   | development server and bundling |
| styling          | tailwindcss                  | 4.1.13  | utility-first css               |
| routing          | react router dom             | 7.9.0   | client-side routing             |
| state management | context api                  | n/a     | global authentication state     |
| http client      | axios                        | 1.10.0  | api communication               |
| ai and ml        | tensorflow.js                | 4.22.0  | animal classification           |
| 3d graphics      | three.js / react three fiber | 0.177.0 | mini zoo game                   |
| charts           | apexcharts                   | 4.7.0   | analytics visualization         |
| animation        | framer motion                | 12.15.0 | ui animation                    |
| icons            | lucide react                 | 0.513.0 | icon library                    |
| pdf generation   | jspdf                        | 3.0.1   | report generation               |
| excel export     | xlsx                         | 0.18.5  | excel export                    |
| qr generation    | qrcode                       | 1.5.4   | qr code generation              |
| qr scanner       | html5-qrcode                 | 2.3.8   | qr code scanning                |

---

## 2.2 backend architecture

| layer            | technology           | version     | purpose                      |
| ---------------- | -------------------- | ----------- | ---------------------------- |
| runtime          | node.js              | current lts | javascript runtime           |
| framework        | express.js           | 4.21.2      | web server framework         |
| database         | mysql                | 8.x         | relational data storage      |
| database driver  | mysql2               | 3.14.0      | mysql connectivity           |
| authentication   | json web token       | 9.0.2       | token-based authentication   |
| password hashing | bcryptjs             | 2.4.3       | secure password hashing      |
| email            | nodemailer           | 8.0.1       | smtp email integration       |
| file upload      | multer               | 1.4.5       | multipart file handling      |
| cors             | cors                 | 2.8.5       | cross-origin request control |
| ai integration   | google generative ai | 0.21.0      | chatbot responses            |

---

## 2.3 database connection

| environment | pool size      | timeout    |
| ----------- | -------------- | ---------- |
| production  | 5 connections  | 10 seconds |
| development | 10 connections | 10 seconds |

features implemented
connection pooling
automatic reconnection
environment-based configuration
promise-based query support

---

## 2.4 api route structure

| route group  | base path         | controller             | key endpoints                                |
| ------------ | ----------------- | ---------------------- | -------------------------------------------- |
| auth         | /api/auth         | auth controller        | login, register, verify-email, logout        |
| google auth  | /api/google-auth  | google auth controller | google login                                 |
| admin        | /api/admin        | admin controller       | users, animals, plants, events, reservations |
| staff        | /api/staff        | staff controller       | tickets, validation, activity logs           |
| user         | /api/users        | user controller        | profile, collections, notifications          |
| reservations | /api/reservations | reservation controller | tickets, events                              |
| messages     | /api/messages     | message controller     | send, list, reply                            |
| ai           | /api/ai           | prediction controller  | predict, chat                                |

---

## 2.5 middleware stack

| middleware         | file                    | purpose                          |
| ------------------ | ----------------------- | -------------------------------- |
| verifytoken        | verify-token.js         | jwt validation                   |
| verifyrole         | verify-role.js          | role-based authorization         |
| trackactivity      | track-activity.js       | staff activity logging           |
| uploadimage        | upload-image.js         | general image uploads            |
| uploadprofileimage | upload-profile-image.js | profile picture uploads          |
| uploadresidentid   | upload-resident-id.js   | resident id verification uploads |

---

## 2.6 security implementation

implemented security

| measure                                     |
| ------------------------------------------- |
| jwt token authentication                    |
| bcrypt password hashing with salt rounds 10 |
| role-based middleware protection            |
| cors configuration                          |
| email verification before login             |
| optional http-only cookie usage             |
| environment variable configuration          |
| frontend validation using zod               |

missing or weak security

| issue                                                |
| ---------------------------------------------------- |
| no rate limiting on authentication endpoints         |
| no csrf protection                                   |
| no request sanitization layer                        |
| missing helmet security headers                      |
| tokens stored in localstorage which exposes xss risk |
| no password complexity rules                         |
| no api key rotation                                  |

---

# 3. current limitations and weaknesses

## 3.1 ui and ux issues

| issue                              | location           | impact                       | priority |
| ---------------------------------- | ------------------ | ---------------------------- | -------- |
| dark mode preference not persisted | global frontend    | inconsistent user experience | medium   |
| missing loading skeletons          | most pages         | perceived slowness           | medium   |
| no offline support                 | entire application | unusable offline             | low      |
| limited accessibility support      | ui components      | accessibility limitations    | high     |
| limited mobile optimization        | layout components  | weak mobile experience       | medium   |
| missing react error boundaries     | components         | unhandled crashes            | high     |
| no pagination for large lists      | animals and events | performance degradation      | high     |
| inconsistent validation messages   | forms              | user confusion               | medium   |

---

## 3.2 performance issues

| issue                        | location          | impact               | recommended solution        |
| ---------------------------- | ----------------- | -------------------- | --------------------------- |
| missing lazy loading         | gallery pages     | slow page loading    | implement lazy loading      |
| large tensorflow model       | animaldex         | 10 to 15 second load | code splitting and caching  |
| no api caching               | api requests      | repeated requests    | react query or swr          |
| large image uploads          | uploads           | heavy payload        | compression                 |
| no content delivery network  | static assets     | slower global access | cdn deployment              |
| synchronous image processing | upload middleware | request blocking     | background queue processing |

---

## 3.3 scalability concerns

| area            | current state           | limitation                     | recommendation  |
| --------------- | ----------------------- | ------------------------------ | --------------- |
| database        | single mysql instance   | no horizontal scaling          | read replicas   |
| file storage    | local uploads folder    | server dependency              | cloud storage   |
| sessions        | stateless jwt           | no forced session invalidation | redis blacklist |
| connection pool | 5 to 10 connections     | limited concurrency            | larger pool     |
| api deployment  | single express instance | single failure point           | load balancing  |

---

## 3.4 security vulnerabilities

| vulnerability                     | risk level | location          | mitigation            |
| --------------------------------- | ---------- | ----------------- | --------------------- |
| missing rate limiting             | high       | auth endpoints    | express-rate-limit    |
| potential sql injection           | high       | raw queries       | parameterized queries |
| xss risk from localstorage tokens | medium     | frontend auth     | http-only cookies     |
| weak cors configuration           | medium     | server config     | origin whitelist      |
| missing helmet                    | medium     | server            | add helmet middleware |
| missing csrf protection           | medium     | forms             | csrf tokens           |
| missing password reset            | high       | auth system       | reset token flow      |
| api keys exposed                  | high       | frontend ai calls | backend proxy         |

---

## 3.5 code quality issues

| issue                         | location             | impact                        |
| ----------------------------- | -------------------- | ----------------------------- |
| oversized controller files    | admin controller     | maintainability difficulty    |
| mixed async patterns          | controllers          | inconsistent code style       |
| missing typescript            | entire project       | lack of type safety           |
| absence of automated tests    | backend and frontend | regression risk               |
| hard-coded values             | configuration        | environment inflexibility     |
| console logging in production | multiple modules     | potential information leakage |
| no api versioning             | route structure      | future breaking changes       |
| duplicated validation logic   | backend and frontend | violation of dry principle    |

---

## 3.6 feature gaps

| missing feature             | impact                      | priority |
| --------------------------- | --------------------------- | -------- |
| password reset system       | account recovery limitation | critical |
| email preference control    | unwanted notifications      | medium   |
| multi language support      | limited audience reach      | medium   |
| payment gateway integration | no online payment           | high     |
| social sharing              | reduced visibility          | low      |
| push notifications          | reduced engagement          | medium   |
| reservation modification    | poor booking flexibility    | high     |
| bulk admin operations       | inefficient management      | medium   |
| user data export            | compliance issues           | medium   |
| two factor authentication   | security weakness           | high     |

---

# 4. improvements to implement

## 4.1 critical priority

| improvement            | description                         | effort  |
| ---------------------- | ----------------------------------- | ------- |
| rate limiting          | protect authentication endpoints    | 2 hours |
| password reset         | email token based reset             | 4 hours |
| error boundaries       | graceful react error handling       | 2 hours |
| input sanitization     | validation for all endpoints        | 4 hours |
| security headers       | implement helmet                    | 1 hour  |
| environment validation | validate required env variables     | 1 hour  |
| pagination             | add pagination to listing endpoints | 4 hours |

---

## 4.2 high priority

| improvement               | description                      | effort  |
| ------------------------- | -------------------------------- | ------- |
| image optimization        | compression and webp conversion  | 4 hours |
| cloud storage             | migrate uploads to cloud storage | 8 hours |
| api caching               | redis caching layer              | 6 hours |
| two factor authentication | totp based security              | 8 hours |
| reservation modification  | allow editing or cancellation    | 6 hours |
| loading states            | skeleton ui components           | 4 hours |
| http-only cookies         | secure jwt storage               | 4 hours |

---

## 4.3 medium priority

| improvement                  | description                | effort   |
| ---------------------------- | -------------------------- | -------- |
| typescript migration         | type safe architecture     | 20 hours |
| unit testing                 | jest and vitest            | 16 hours |
| api versioning               | versioned api structure    | 4 hours  |
| theme persistence            | store dark mode preference | 2 hours  |
| accessibility compliance     | wcag improvements          | 12 hours |
| mobile optimization          | responsive enhancement     | 8 hours  |
| advanced analytics dashboard | trend based insights       | 8 hours  |

---

## 4.4 low priority backlog

| improvement             | description              | effort   |
| ----------------------- | ------------------------ | -------- |
| progressive web app     | offline capability       | 12 hours |
| internationalization    | multi language support   | 16 hours |
| push notifications      | firebase messaging       | 8 hours  |
| social login expansion  | facebook and apple login | 6 hours  |
| advanced reporting      | automated reports        | 12 hours |
| admin bulk operations   | multi select actions     | 8 hours  |
| websocket notifications | real time updates        | 8 hours  |

---

# 5. engagement and client value suggestions

## 5.1 gamification features

| feature               | description                        | value                |
| --------------------- | ---------------------------------- | -------------------- |
| achievement badges    | unlock badges for scanning animals | improved retention   |
| leaderboards          | weekly or monthly ranking          | social competition   |
| daily challenges      | daily scanning quests              | repeated usage       |
| collection milestones | rewards for discovery milestones   | long term engagement |
| streak rewards        | daily visit streaks                | habit building       |

---

## 5.2 loyalty and rewards program

| feature            | description                 | value                    |
| ------------------ | --------------------------- | ------------------------ |
| points system      | points per visit or booking | repeat purchases         |
| membership tiers   | bronze silver gold platinum | status motivation        |
| birthday discounts | personalized offers         | customer connection      |
| referral program   | invite friends rewards      | organic growth           |
| family packages    | bundled tickets             | higher revenue per visit |

---

## 5.3 educational engagement

| feature              | description             | value                 |
| -------------------- | ----------------------- | --------------------- |
| animal quizzes       | educational quizzes     | learning engagement   |
| conservation stories | rescue narratives       | emotional connection  |
| virtual zoo tours    | immersive exploration   | remote audience       |
| school portal        | education group booking | institutional revenue |
| live animal cameras  | real time streams       | daily visits          |

---

## 5.4 personalization

| feature               | description             | value                   |
| --------------------- | ----------------------- | ----------------------- |
| favorite animals      | mark favorites          | personalized experience |
| recommendation system | suggested animals       | discovery               |
| visit planner         | itinerary builder       | improved visits         |
| photo memories        | visit photo archive     | emotional engagement    |
| symbolic adoption     | adopt animals virtually | conservation support    |

---

# 6. strategic growth suggestions

## 6.1 monetization opportunities

| opportunity             | description                    | revenue potential  |
| ----------------------- | ------------------------------ | ------------------ |
| online ticketing        | integrate gcash maya or paypal | primary revenue    |
| premium membership      | exclusive benefits             | recurring income   |
| online gift shop        | zoo merchandise sales          | additional income  |
| sponsored events        | corporate partnerships         | business revenue   |
| photo packages          | professional photos            | upsell opportunity |
| behind the scenes tours | exclusive tours                | premium offering   |

---

## 6.2 partnership opportunities

| partner type               | value exchange           |
| -------------------------- | ------------------------ |
| hotels and resorts         | bundled tourism packages |
| schools and universities   | educational programs     |
| tourism agencies           | travel package inclusion |
| conservation organizations | joint campaigns          |
| local businesses           | cross promotion          |
| influencers and bloggers   | marketing reach          |

---

## 6.3 technical growth path

| phase                          | focus            | key actions                              |
| ------------------------------ | ---------------- | ---------------------------------------- |
| phase 1 (0–3 months)           | stability        | security fixes and essential features    |
| phase 2 (3–6 months)           | scalability      | cloud migration and cdn                  |
| phase 3 (6–12 months)          | expansion        | mobile applications and advanced ai      |
| phase 4 (12 months and beyond) | analytics and ai | predictive analytics and ml optimization |

---

## 6.4 seo and marketing improvements

| area              | current state | recommendation                 |
| ----------------- | ------------- | ------------------------------ |
| meta tags         | basic         | dynamic meta tags              |
| schema markup     | none          | localbusiness and event schema |
| sitemap           | none          | automated sitemap generation   |
| page speed        | unoptimized   | core web vitals optimization   |
| social cards      | basic         | open graph metadata            |
| content marketing | none          | educational blog content       |
| local seo         | minimal       | google business optimization   |

---

# summary

the zoo bulusan calapan system is a full-stack platform built with react and express. the system integrates ai-driven features such as animal classification and a chatbot assistant. these features extend beyond a typical booking platform and introduce interactive and educational experiences.

key strengths
modern technology stack
ai powered engagement features
structured role-based architecture
comprehensive zoo management features

priority actions
security hardening including rate limiting and input validation
password reset functionality
performance improvements including image optimization and caching
payment integration for online ticket sales
mobile user experience improvements

long term direction
evolve the system into a digital zoo experience platform combining booking, gamification, education, community engagement, and data analytics to increase visitor retention and revenue.
