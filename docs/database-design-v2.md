# Thiet ke co so du lieu moi de xuat

Ban thiet ke nay duoc de xuat lai theo huong chuan hoa hon, de tranh luu du lieu lap trong JSON va de dat gan 3NF hon so voi thiet ke cu.

## 1. So do dang de trinh bay

```text
USERS
-------------------------
user_id (PK)
name
username
email
password
phone_number
address
avatar
role
status
created_at
updated_at

|
| 1
|
| n

SHOPS
-------------------------
shop_id (PK)
user_id (FK)
shop_name
logo_url
address
description
status
created_at
updated_at
```

```text
SHOPS
-------------------------
shop_id (PK)

|
| 1
|
| n

PRODUCTS
-------------------------
product_id (PK)
shop_id (FK)
product_name
brand
material
origin
description
price
status
created_at
updated_at
```

```text
PRODUCTS
-------------------------
product_id (PK)

|
| 1
|
| n

PRODUCT_VARIANTS
-------------------------
variant_id (PK)
product_id (FK)
color
size
quantity
sold
created_at
updated_at
```

```text
PRODUCTS
-------------------------
product_id (PK)

|
| 1
|
| n

PRODUCT_IMAGES
-------------------------
image_id (PK)
product_id (FK)
image_url
is_thumbnail
created_at
updated_at
```

```text
CATEGORIES
-------------------------
category_id (PK)
category_name
slug
created_at
updated_at

|
| n
|
| n

PRODUCTS
-------------------------
product_id (PK)


Bang trung gian:

PRODUCT_CATEGORIES
-------------------------
product_id (PK, FK)
category_id (PK, FK)
```

```text
USERS
-------------------------
user_id (PK)

|
| 1
|
| 1

CARTS
-------------------------
cart_id (PK)
user_id (FK)
created_at
updated_at

|
| 1
|
| n

CART_ITEMS
-------------------------
cart_item_id (PK)
cart_id (FK)
variant_id (FK)
quantity
created_at
updated_at
```

```text
USERS
-------------------------
user_id (PK)

|
| 1
|
| n

ORDERS
-------------------------
order_id (PK)
user_id (FK)
shop_id (FK)
total_amount
order_status
payment_status
shipping_address
created_at
updated_at

|
| 1
|
| n

ORDER_ITEMS
-------------------------
order_item_id (PK)
order_id (FK)
product_id (FK)
variant_id (FK)
product_name
color
size
quantity
price
subtotal
created_at
updated_at
```

```text
PRODUCTS
-------------------------
product_id (PK)

|
| 1
|
| n

REVIEWS
-------------------------
review_id (PK)
user_id (FK)
product_id (FK)
order_item_id (FK)
rating
comment
image_url
created_at
updated_at


USERS
-------------------------
user_id (PK)

|
| 1
|
| n

REVIEWS
```

```text
USERS
-------------------------
user_id (PK)

|
| 1
|
| n

CHAT_HISTORY
-------------------------
chat_id (PK)
user_id (FK)
question
answer
created_at
```

```text
ORDERS
-------------------------
order_id (PK)

|
| 1
|
| 1

PAYMENTS
-------------------------
payment_id (PK)
order_id (FK)
payment_method
amount
status
paid_at
created_at
updated_at
```

## 2. So do ERD Mermaid

```mermaid
erDiagram
    USERS ||--o{ SHOPS : owns
    SHOPS ||--o{ PRODUCTS : sells
    PRODUCTS ||--o{ PRODUCT_VARIANTS : has
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS }o--o{ CATEGORIES : belongs_to
    USERS ||--o| CARTS : has
    CARTS ||--o{ CART_ITEMS : contains
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : selected
    USERS ||--o{ ORDERS : places
    SHOPS ||--o{ ORDERS : receives
    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : snapshot_of
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : selected
    USERS ||--o{ REVIEWS : writes
    PRODUCTS ||--o{ REVIEWS : receives
    ORDER_ITEMS ||--o| REVIEWS : verifies
    USERS ||--o{ CHAT_HISTORY : asks
    ORDERS ||--o| PAYMENTS : paid_by

    USERS {
        bigint user_id PK
        string name
        string username UK
        string email UK
        string password
        string phone_number
        string address
        string avatar
        enum role
        enum status
        timestamp created_at
        timestamp updated_at
    }

    SHOPS {
        bigint shop_id PK
        bigint user_id FK
        string shop_name
        string logo_url
        string address
        text description
        enum status
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS {
        bigint product_id PK
        bigint shop_id FK
        string product_name
        string brand
        string material
        string origin
        text description
        decimal price
        enum status
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT_VARIANTS {
        bigint variant_id PK
        bigint product_id FK
        string color
        string size
        integer quantity
        integer sold
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT_IMAGES {
        bigint image_id PK
        bigint product_id FK
        string image_url
        boolean is_thumbnail
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        bigint category_id PK
        string category_name UK
        string slug
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT_CATEGORIES {
        bigint product_id PK,FK
        bigint category_id PK,FK
    }

    CARTS {
        bigint cart_id PK
        bigint user_id FK
        timestamp created_at
        timestamp updated_at
    }

    CART_ITEMS {
        bigint cart_item_id PK
        bigint cart_id FK
        bigint variant_id FK
        integer quantity
        timestamp created_at
        timestamp updated_at
    }

    ORDERS {
        bigint order_id PK
        bigint user_id FK
        bigint shop_id FK
        decimal total_amount
        enum order_status
        enum payment_status
        string shipping_address
        timestamp created_at
        timestamp updated_at
    }

    ORDER_ITEMS {
        bigint order_item_id PK
        bigint order_id FK
        bigint product_id FK
        bigint variant_id FK
        string product_name
        string color
        string size
        integer quantity
        decimal price
        decimal subtotal
        timestamp created_at
        timestamp updated_at
    }

    REVIEWS {
        bigint review_id PK
        bigint user_id FK
        bigint product_id FK
        bigint order_item_id FK
        tinyint rating
        text comment
        string image_url
        timestamp created_at
        timestamp updated_at
    }

    CHAT_HISTORY {
        bigint chat_id PK
        bigint user_id FK
        text question
        text answer
        timestamp created_at
    }

    PAYMENTS {
        bigint payment_id PK
        bigint order_id FK
        string payment_method
        decimal amount
        enum status
        timestamp paid_at
        timestamp created_at
        timestamp updated_at
    }
```

## 3. Diem cai tien so voi thiet ke cu

- Tach `orders.order_details` thanh bang `order_items`.
- Tach `products.colors` va `products.size_details` thanh bang `product_variants`.
- Tach gio hang thanh `carts` va `cart_items`, de mot user co mot gio hang va gio hang co nhieu san pham.
- Them `payments` de quan ly thong tin thanh toan rieng voi don hang.
- Them `chat_history` de luu lich su hoi dap cua chatbot tu van san pham.
- Giu `product_name`, `color`, `size`, `price` trong `order_items` de luu snapshot tai thoi diem dat hang.

## 4. Danh gia chuan hoa

Thiet ke moi dat gan 3NF hon vi:

- Moi bang quan ly mot nhom du lieu rieng.
- Khong luu danh sach nhieu gia tri trong mot cot JSON.
- Quan he nhieu-nhieu duoc tach bang trung gian.
- Chi tiet don hang va bien the san pham duoc tach rieng.

Luu y: `order_items.product_name`, `order_items.color`, `order_items.size`, `order_items.price` co the xem la du lieu lap so voi `products` va `product_variants`, nhung duoc giu lai co chu dich de luu lich su tai thoi diem mua hang. Day la phi chuan hoa co kiem soat va phu hop voi he thong ban hang.
