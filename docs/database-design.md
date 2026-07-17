# So do thiet ke co so du lieu

Tai lieu nay duoc tong hop tu migration va Eloquent model trong project Laravel `web-server`.

## So do ERD

```mermaid
erDiagram
    USERS {
        bigint id PK
        string name
        string username UK
        string phone_number
        string address
        string profile_image_url
        string password
        enum role "admin | user | shop_owner"
        string remember_token
        timestamp created_at
        timestamp updated_at
    }

    SHOPS {
        bigint id PK
        bigint user_id FK
        string name
        string logo_url
        text description
        string address
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS {
        bigint id PK
        bigint shop_id FK
        string name
        string brand
        json colors
        string material
        string origin
        text description
        decimal price
        json size_details
        integer quantity
        integer sold
        string image_url
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        bigint id PK
        string name UK
        string slug
        timestamp created_at
        timestamp updated_at
    }

    CATEGORY_PRODUCT {
        bigint category_id PK,FK
        bigint product_id PK,FK
    }

    PRODUCT_IMAGES {
        bigint id PK
        bigint product_id FK
        string url
        boolean is_thumbnail
        timestamp created_at
        timestamp updated_at
    }

    CARTS {
        bigint id PK
        bigint user_id FK
        bigint product_id FK
        string size
        string color
        smallint quantity
        timestamp created_at
        timestamp updated_at
    }

    ORDERS {
        bigint id PK
        bigint user_id FK
        bigint shop_id FK
        unsignedBigInteger total_amount
        json order_details
        enum status "pending | confirmed | shipping | delivered | cancelled | returned"
        enum payment_status "unpaid | paid | refunded"
        string shipping_address
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT_REVIEWS {
        bigint id PK
        bigint product_id FK
        bigint user_id FK
        bigint order_id FK
        tinyint rating
        text comment
        string image_url
        timestamp created_at
        timestamp updated_at
    }

    SHOP_MONTHLY_STATISTICS {
        bigint id PK
        bigint shop_id FK
        string month
        integer total_orders
        integer pending_orders
        integer completed_orders
        integer sold_products
        decimal revenue
        timestamp created_at
        timestamp updated_at
    }

    USERS ||--o| SHOPS : "so huu"
    SHOPS ||--o{ PRODUCTS : "dang ban"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "co anh"
    PRODUCTS }o--o{ CATEGORIES : "thuoc danh muc"
    CATEGORIES ||--o{ CATEGORY_PRODUCT : "phan loai"
    PRODUCTS ||--o{ CATEGORY_PRODUCT : "duoc gan"
    USERS ||--o{ CARTS : "them vao gio"
    PRODUCTS ||--o{ CARTS : "nam trong gio"
    USERS ||--o{ ORDERS : "dat hang"
    SHOPS ||--o{ ORDERS : "nhan don"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : "duoc danh gia"
    USERS ||--o{ PRODUCT_REVIEWS : "viet danh gia"
    ORDERS ||--o{ PRODUCT_REVIEWS : "can cu danh gia"
    SHOPS ||--o{ SHOP_MONTHLY_STATISTICS : "tong hop"
```

## Ghi chu thiet ke

- `users.role` phan quyen tai khoan gom `admin`, `user`, `shop_owner`.
- Moi `shop` thuoc ve mot `user` thong qua `shops.user_id`.
- Moi `product` thuoc ve mot `shop`; anh san pham tach rieng trong `product_images`.
- Quan he san pham - danh muc la nhieu-nhieu qua bang trung gian `category_product`.
- Gio hang luu tung bien the san pham theo `user_id`, `product_id`, `size`, `color`; bo cot nay duoc rang buoc unique.
- Don hang luu chi tiet san pham trong cot JSON `orders.order_details`, thay vi tach bang `order_items`.
- Danh gia san pham lien ket dong thoi voi `product`, `user` va `order`.
- `shop_monthly_statistics` luu so lieu thong ke theo cap `shop_id` va `month`; cap nay duoc rang buoc unique.

## Cac rang buoc va chi muc quan trong

- `users.username` la unique.
- `categories.name` la unique.
- `category_product` dung khoa chinh ghep: `category_id`, `product_id`.
- `carts` unique theo: `user_id`, `product_id`, `size`, `color`.
- `shop_monthly_statistics` unique theo: `shop_id`, `month`.
- `orders` co index thong ke theo `shop_id + created_at` va `shop_id + status + payment_status`.
