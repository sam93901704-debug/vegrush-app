import OrderTrackingClient from './OrderTrackingClient';

export async function generateStaticParams() {
  // Return empty array for client-side dynamic routes
  // This satisfies Next.js static export requirement
  return [];
}

interface Address {
  id: string;
  label: string | null;
  fullAddress: string;
  city: string | null;
  pincode: string | null;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  productId: string;
  qty: string;
  unitPrice: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    category: string;
    imageUrl: string | null;
  };
}

interface DeliveryBoy {
  id: string;
  name: string;
  phone: string;
  vehicleNumber?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: string;
  status: string;
  assignedDeliveryId: string | null;
  pickedAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: Address & {
    latitude?: string | number;
    longitude?: string | number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  assignedDelivery?: DeliveryBoy | null;
}

export default function OrderTrackingPage() {
  return <OrderTrackingClient />;
}

