# ChefCito - Restaurant Management System

ChefCito is a modern restaurant management system built with Next.js 14, featuring Point of Sale (POS), Kitchen Display System (KDS), inventory management, and more.

## Features

- 🍽️ **Point of Sale (POS)** - Intuitive order taking and payment processing
- 👨‍🍳 **Kitchen Display System (KDS)** - Real-time order management for kitchen staff
- 📊 **Reports & Analytics** - Business insights and performance metrics
- 🏪 **Restaurant Management** - Menu, inventory, and staff management
- 👥 **User Management** - Role-based access control system
- 💳 **Payment Processing** - Integrated with PayPhone for Ecuador
- 📱 **Mobile Responsive** - Works on all devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Shadcn/ui, Tailwind CSS
- **State Management**: Zustand, SWR
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based auth
- **Internationalization**: Custom i18n implementation
- **Payment Gateway**: PayPhone API integration

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- PayPhone API credentials (for payment processing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chefcito-main
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure your `.env.local` file:
```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=chefcito

# PayPhone API Configuration (optional)
TOKEN=your_payphone_token
STORE_ID=your_store_id
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## PayPhone Integration

ChefCito integrates with PayPhone, Ecuador's leading mobile payment platform. This enables restaurants to accept payments via:

- Mobile phone payments
- WhatsApp payments
- SMS payments
- QR code payments

### Setting up PayPhone

1. Register for a PayPhone merchant account at [payphone.ec](https://www.payphone.ec)
2. Obtain your API credentials (Client ID and Client Secret)
3. Add the credentials to your `.env.local` file
4. Configure PayPhone as a payment method in the Restaurant settings

### Features

- **Secure Payments**: End-to-end encryption and PCI compliance
- **Multiple Channels**: Customers can pay via WhatsApp, SMS, or mobile app
- **Real-time Status**: Instant payment confirmation and status updates
- **Refunds**: Built-in refund processing capability
- **Webhooks**: Automatic notification of payment status changes

## Membership Management

ChefCito includes a membership system with two tiers:

- **Free Tier**: Basic features and limited access
- **Pro Tier**: Full feature set ($9.99/month)

Members can upgrade/downgrade directly from their profile page using PayPhone payments.

## Project Structure

```
src/
├── app/                 # Next.js 14 app directory
│   ├── (app)/          # Main application routes
│   │   ├── kds/        # Kitchen Display System
│   │   ├── orders/     # Order management
│   │   ├── pos/        # Point of Sale
│   │   ├── profile/    # User profile
│   │   ├── reports/    # Business reports
│   │   └── restaurant/ # Restaurant management
│   ├── api/            # API routes
│   └── login/          # Authentication
├── components/         # Reusable UI components
├── lib/               # Utilities and business logic
├── models/            # Database models
├── services/          # External service integrations
└── locales/           # Internationalization files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@chefcito.com or join our Slack community.