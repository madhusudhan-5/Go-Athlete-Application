# Admin Console

A minimal monorepo with Django REST backend and React frontend for administrative operations including vendor management, booking oversight, and support tickets.

## Project Structure

```
/
├── backend/          # Django REST API
│   ├── backend/      # Django project settings
│   ├── superadmin/   # Main app with models and views
│   └── manage.py
├── frontend/         # React application
│   ├── src/
│   │   ├── pages/    # All page components
│   │   ├── api.js    # API client
│   │   └── App.js    # Main application
│   └── package.json
└── README.md
```

## Models

### Admin Console Models
- **Vendor**: Business onboarding with KYC document tracking and approval workflow
- **Court**: Sports courts with type, hourly rate, and amenities
- **Customer**: End users with booking history
- **Booking**: Court reservations with adjustment capability
- **Ticket**: Support tickets with priority and assignment

### Super-Admin Models
- **GlobalConfig**: Commission settings (percentage, payout cycle, min threshold)
- **Offer**: Promotional offers with type (flat/percent) and categories
- **AuditLog**: Activity tracking with old/new values
- **VendorSummary**: Vendor performance metrics

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login/ | Login with email/password, returns JWT |

### Admin Console
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard/ | Admin dashboard stats |
| GET/POST | /api/vendors/ | List/create vendors |
| GET/PUT/DELETE | /api/vendors/:id/ | Vendor CRUD |
| POST | /api/vendors/:id/approve/ | Approve vendor |
| POST | /api/vendors/:id/reject/ | Reject vendor with reason |
| GET/POST | /api/bookings/ | List/create bookings |
| GET | /api/bookings/:id/ | Booking detail |
| POST | /api/bookings/:id/adjust/ | Adjust booking amount |
| GET/POST | /api/tickets/ | List/create tickets |
| GET/PATCH | /api/tickets/:id/ | Ticket detail/update |
| POST | /api/tickets/:id/assign/ | Assign ticket |
| POST | /api/send-sms/ | Send SMS via Twilio |

### Super-Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/super/summary/ | Super dashboard KPIs |
| GET/PATCH | /api/global-config/ | Global configuration |
| GET/POST/PUT/DELETE | /api/offers/ | Offers CRUD |
| GET | /api/audit-logs/ | Paginated audit logs |

## Start Commands

### Backend (Port 8000)

```bash
cd backend
python manage.py migrate
python manage.py bootstrap_admin  # Creates admin@example.com / admin123
python manage.py runserver 0.0.0.0:8000
```

### Frontend (Port 5000)

```bash
cd frontend
npm install
npm start
```

## Default Credentials

- Email: `admin@example.com`
- Password: `admin123`

## Environment Variables

- `TWILIO_SID`: Twilio Account SID (optional in LOG mode)
- `TWILIO_TOKEN`: Twilio Auth Token (optional in LOG mode)
- `TWILIO_FROM`: Twilio phone number (optional in LOG mode)
- `SMS_MODE`: Set to 'LOG' (default) or 'TWILIO' for actual SMS

## Pages

### Admin Console
- **Admin Dashboard**: Pending vendors count, open tickets, recent activity
- **Vendor Approvals**: List with status filter, detail drawer, approve/reject actions, KYC viewer
- **Booking Oversight**: List with filters, detail drawer, amount adjustment
- **Support Tickets**: List with priority/status, assign, status workflow

### Super-Admin
- **Super Dashboard**: Revenue, bookings, vendors KPIs
- **Offers**: Card grid with FAB, full CRUD
- **Global Config**: Commission settings
- **Audit Logs**: Paginated with detail drawer

## Design

Material Design 3 inspired:
- Primary: #061A2C
- Accent: #D96A23

## Design Decisions

- Static SVG chart placeholders (no heavy chart libraries)
- Pagination fixed at 10 rows per page
- No file upload functionality
- SMS defaults to LOG mode for debugging
