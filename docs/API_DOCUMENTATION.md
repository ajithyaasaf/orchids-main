# TNtrends E-commerce API Documentation

Base URL: `http://localhost:5000` (development) or your deployed backend URL

## Authentication

Most endpoints require authentication using Firebase ID tokens.

Include the token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## Products API

### Get All Products
```http
GET /api/products
```

**Query Parameters:**
- `category` (optional): Filter by category
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `sizes` (optional): Comma-separated sizes (e.g., "S,M,L")
- `inStock` (optional): Filter by stock availability (true/false)
- `search` (optional): Search in title and description
- `sortBy` (optional): Sort order (price_asc, price_desc, newest, oldest)
- `limit` (optional): Number of results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-id",
      "title": "Product Name",
      "description": "Product description",
      "price": 1299,
      "discountType": "percentage",
      "discountValue": 20,
      "category": "men",
      "sizes": ["S", "M", "L", "XL"],
      "stockBySize": {
        "S": 10,
        "M": 15,
        "L": 20,
        "XL": 5
      },
      "inStock": true,
      "images": [
        {
          "url": "https://res.cloudinary.com/...",
          "publicId": "tntrends/products/..."
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 10
}
```

### Get Single Product
```http
GET /api/products/:id
```

**Response:**
```json
{
  "success": true,
  "data": { /* product object */ }
}
```

### Create Product (Superadmin Only)
```http
POST /api/admin/products
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New Product",
  "description": "Product description",
  "price": 1299,
  "discountType": "percentage",
  "discountValue": 20,
  "category": "men",
  "sizes": ["S", "M", "L", "XL"],
  "stockBySize": {
    "S": 10,
    "M": 15,
    "L": 20,
    "XL": 5
  },
  "inStock": true,
  "images": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "tntrends/products/..."
    }
  ]
}
```

### Update Product (Admin + Superadmin)
```http
PUT /api/admin/products/:id
Authorization: Bearer <token>
```

**Request Body:** Same as create (partial updates allowed)

### Delete Product (Superadmin Only)
```http
DELETE /api/admin/products/:id
Authorization: Bearer <token>
```

### Update Stock
```http
PATCH /api/admin/products/:id/stock
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "size": "M",
  "quantity": 25
}
```

## Orders API

### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product-id",
      "productTitle": "Product Name",
      "productImage": "https://...",
      "size": "M",
      "quantity": 2,
      "price": 1299
    }
  ],
  "totalAmount": 2598,
  "paymentStatus": "pending",
  "orderStatus": "placed",
  "address": {
    "name": "John Doe",
    "phone": "+919876543210",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "razorpayOrderId": "order_xxxxx"
}
```

### Get User Orders
```http
GET /api/orders/user/:userId
Authorization: Bearer <token>
```

### Get Single Order
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

### Get All Orders (Admin Only)
```http
GET /api/admin/orders/all
Authorization: Bearer <token>
```

**Query Parameters:**
- `orderStatus` (optional): Filter by order status
- `paymentStatus` (optional): Filter by payment status
- `limit` (optional): Number of results

### Update Order Status (Admin Only)
```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "orderStatus": "shipped"
}
```

**Valid Status Values:**
- `placed`
- `confirmed`
- `shipped`
- `delivered`
- `cancelled`

## Payment API

### Create Razorpay Order
```http
POST /api/payment/create-order
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 2598
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xxxxx",
    "amount": 2598,
    "currency": "INR",
    "key": "rzp_test_xxxxx"
  }
}
```

### Verify Payment
```http
POST /api/payment/verify
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "razorpayOrderId": "order_xxxxx",
  "razorpayPaymentId": "pay_xxxxx",
  "razorpaySignature": "signature_xxxxx",
  "orderId": "firestore-order-id"
}
```

### Get Razorpay Key
```http
GET /api/payment/key
```

## Upload API

### Upload Image (Admin Only)
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: Image file (max 5MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "tntrends/products/..."
  }
}
```

## Settings API

### Get Global Settings
```http
GET /api/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shippingCharge": 50,
    "freeShippingAbove": 999,
    "codEnabled": true,
    "returnPolicyDays": 7
  }
}
```

### Update Settings (Superadmin Only)
```http
PUT /api/settings
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "shippingCharge": 60,
  "freeShippingAbove": 1000,
  "codEnabled": true,
  "returnPolicyDays": 7
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware.

## Notes

1. All prices are in Indian Rupees (INR)
2. All timestamps are in ISO 8601 format
3. Image URLs are served from Cloudinary CDN
4. Firebase ID tokens expire after 1 hour - frontend should refresh tokens automatically
