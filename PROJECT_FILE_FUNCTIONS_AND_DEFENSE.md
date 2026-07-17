# Chuc nang tung file va cau hoi phan bien do an

## 1. Tong quan he thong

Do an la website thuong mai dien tu thoi trang gom 2 phan:

- `web-client`: frontend React + TypeScript + Vite, phu trach giao dien nguoi dung, admin, chu cua hang va chatbot.
- `web-server`: backend Laravel, phu trach API, xac thuc, san pham, gio hang, don hang, thong ke, Qdrant va Ollama.

Kien truc chinh:

- Frontend goi REST API qua Axios.
- Backend dung Laravel Sanctum cho token login.
- PostgreSQL luu du lieu nghiep vu.
- Qdrant lam vector database cho tim san pham lien quan.
- Ollama dung model chat `qwen2.5:1.5b` va embedding co the dung `nomic-embed-text`.

## 2. Chuc nang cac file frontend `web-client`

### File cau hinh goc

- `package.json`: khai bao thu vien frontend, script chay dev/build/type-check.
- `package-lock.json`: khoa phien ban dependency npm.
- `index.html`: HTML goc de Vite mount React app.
- `vite.config.ts`: cau hinh Vite, alias import, dev server.
- `tsconfig.json`: cau hinh TypeScript cho frontend.
- `tsconfig.node.json`: cau hinh TypeScript cho file Node/Vite.
- `tailwind.config.js`: cau hinh Tailwind CSS.
- `postcss.config.js`: cau hinh PostCSS.
- `src/vite-env.d.ts`: khai bao type mac dinh cua Vite.
- `src/index.css`: CSS global, Tailwind base/components/utilities.
- `src/main.tsx`: diem khoi dong React, render `App`.
- `src/App.tsx`: boc router, cau hinh Axios interceptor va chatbot global.
- `src/axiosConfig.ts`: gan/xoa Authorization header cho Axios theo token localStorage.

### Public assets

- `public/size.jpg`: anh bang huong dan size trong trang chi tiet san pham.
- `public/QR.jpg`: anh QR thanh toan trong modal thanh toan.

### API frontend

- `src/api/axios.ts`: Axios instance dung chung neu can gom cau hinh API.
- `src/api/addressApi.ts`: goi API dia chi de lay quoc gia/thanh pho/tinh.
- `src/api/cartApi.ts`: API gio hang, them/sua/xoa san pham theo `product_id + color + size`.
- `src/api/orderApi.ts`: API tao don, lich su don, cap nhat/huy/tra don, thong ke shop.
- `src/api/productApi.ts`: API san pham, type `Product`, review, CRUD san pham.
- `src/api/productAdvisorApi.ts`: API chatbot tu van san pham, gui token neu co.
- `src/api/shopApi.ts`: API thong tin cua hang cua chu shop.
- `src/api/users.ts`: API quan ly/cap nhat nguoi dung.

### Components

- `src/components/AddressSelector.tsx`: component chon dia chi theo quoc gia/tinh/thanh pho.
- `src/components/ProductAdvisorChatbot.tsx`: chatbot noi goc phai, goi API tu van, hien goi y san pham va link chi tiet.

### Layout

- `src/layouts/AdminLayout.tsx`: layout tong cho trang admin.
- `src/layouts/DashboardLayout.tsx`: layout dashboard/admin co sidebar.
- `src/layouts/Sidebar.tsx`: menu ben trai cua admin.
- `src/layouts/ShopSidebar.tsx`: menu ben trai cua chu cua hang.
- `src/layouts/UserFooter.tsx`: footer trang nguoi dung.
- `src/layouts/UserNavbar.tsx`: navbar nguoi dung, tim kiem, gio hang, profile, dang xuat.

### Router

- `src/router/index.tsx`: router tong, dieu huong theo role `admin`, `shop_owner`, `user`, guest.
- `src/router/admin.tsx`: danh sach route cua admin.
- `src/router/shop.tsx`: danh sach route cua chu cua hang.
- `src/router/duong.tsx`: route phia nguoi dung/khach.

### Trang login

- `src/pages/login/login.tsx`: form dang nhap, luu token/user, dieu huong theo role.
- `src/pages/login/Register.tsx`: form dang ky nguoi dung/chu cua hang, bat buoc phone/address.
- `src/pages/login/LogoutButton.tsx`: dang xuat, xoa token/user va reload ve trang chu.

### Trang nguoi dung

- `src/pages/user/Dashboard.tsx`: container trang nguoi dung, dieu huong noi bo home/cart/detail/profile/orders.
- `src/pages/user/HeroSlider.tsx`: banner/slider danh muc trang chu.
- `src/pages/user/productList.tsx`: danh sach san pham, tim kiem, them nhanh vao gio theo mau/size con hang.
- `src/pages/user/ProductDetailPage.tsx`: chi tiet san pham, anh, gia, shop, thuong hieu, mo ta, chon mau/size, them gio hang, review.
- `src/pages/user/Cart.tsx`: gio hang, cap nhat so luong theo mau/size, thanh toan COD/chuyen khoan.
- `src/pages/user/UserProfile.tsx`: thong tin ca nhan, cap nhat phone/address.
- `src/pages/user/UserOrderHistory.tsx`: lich su don hang, huy/tra don, danh gia san pham.
- `src/pages/user/home.tsx`: trang home cu/phu neu con duoc import.

### Trang admin

- `src/pages/admin/Dashboard.tsx`: dashboard tong quan admin.
- `src/pages/admin/AdminOrderManagement.tsx`: admin/quan tri xem va cap nhat don hang.
- `src/pages/admin/Products.tsx`: admin quan ly san pham, anh, danh muc, thuong hieu, chat lieu, mau-size-ton kho.
- `src/pages/admin/UserManagement.tsx`: quan ly nguoi dung, role, phone/address.
- `src/pages/admin/Statistics.tsx`: thong ke admin neu duoc route su dung.
- `src/pages/admin/Finance.tsx`: trang tai chinh/thong ke phu neu duoc route su dung.

### Trang chu cua hang

- `src/pages/shop/ShopLayout.tsx`: layout rieng cua chu cua hang.
- `src/pages/shop/Dashboard.tsx`: dashboard shop, doc bang thong ke thang, bieu do doanh thu va don hoan thanh.
- `src/pages/shop/Products.tsx`: chu shop CRUD san pham cua shop, ton kho theo mau/size.
- `src/pages/shop/Orders.tsx`: chu shop xem/cap nhat don hang cua shop.
- `src/pages/shop/Profile.tsx`: cap nhat thong tin cua hang.

### Type

- `src/types/user.ts`: khai bao type lien quan nguoi dung.

## 3. Chuc nang cac file backend `web-server`

### File cau hinh Laravel/package

- `composer.json`: dependency PHP/Laravel.
- `composer.lock`: khoa phien ban dependency PHP.
- `package.json`: dependency JS phia Laravel Mix neu co.
- `webpack.mix.js`: cau hinh Laravel Mix mac dinh.
- `artisan`: CLI Laravel.
- `server.php`: entry server Laravel cu.
- `phpunit.xml`: cau hinh test PHPUnit.
- `README.md`: tai lieu mac dinh/backend.
- `public/index.php`: entrypoint HTTP cua Laravel.
- `public/robots.txt`, `public/favicon.ico`: asset public mac dinh.

### Config Laravel

- `config/app.php`: cau hinh app Laravel.
- `config/auth.php`: cau hinh guard/provider xac thuc.
- `config/broadcasting.php`: cau hinh broadcast.
- `config/cache.php`: cau hinh cache.
- `config/cors.php`: CORS cho frontend goi API.
- `config/database.php`: ket noi database PostgreSQL.
- `config/filesystems.php`: cau hinh luu file.
- `config/hashing.php`: hash password.
- `config/logging.php`: log Laravel.
- `config/mail.php`: mail.
- `config/queue.php`: queue.
- `config/sanctum.php`: token API Sanctum.
- `config/services.php`: cau hinh Ollama va Qdrant.
- `config/session.php`: session.
- `config/view.php`: view Blade.

### Routes

- `routes/api.php`: include cac route API con.
- `routes/web.php`: route web mac dinh.
- `routes/console.php`: command console.
- `routes/channels.php`: broadcast channel.
- `routes/login/login.php`: route login/logout.
- `routes/user/user.php`: route quan ly user/profile.
- `routes/product/product.php`: route san pham, review, chatbot.
- `routes/cart/cart.php`: route gio hang.
- `routes/orders/orders.php`: route don hang, thong ke, huy/tra/cap nhat.
- `routes/shop/shop.php`: route thong tin cua hang va san pham cua shop.

### Models

- `app/Models/User.php`: model nguoi dung, role `admin/user/shop_owner`, lien ket shop.
- `app/Models/Shop.php`: model cua hang, lien ket owner, products, orders.
- `app/Models/Product.php`: san pham, cast `size_details/colors`, tinh `available_sizes`, `available_colors`, `remaining`, `thumbnail_url`.
- `app/Models/ProductImage.php`: anh san pham, anh thumbnail.
- `app/Models/Category.php`: danh muc san pham.
- `app/Models/Cart.php`: gio hang, luu `user_id`, `product_id`, `size`, `color`, `quantity`.
- `app/Models/Order.php`: don hang, luu `order_details` JSON, status, payment_status, shop_id.
- `app/Models/ProductReview.php`: danh gia san pham.
- `app/Models/ShopMonthlyStatistic.php`: bang thong ke nhanh theo shop/thang.

### Controllers API

- `app/Http/Controllers/Controller.php`: controller base Laravel.
- `app/Http/Controllers/API/AuthenticateController.php`: controller xac thuc phu/cu neu con dung.
- `app/Http/Controllers/API/login/LoginController.php`: dang nhap/dang xuat, tao token Sanctum.
- `app/Http/Controllers/API/users/UserController.php`: CRUD/user profile, bat buoc phone/address.
- `app/Http/Controllers/API/shops/ShopController.php`: xem/cap nhat thong tin cua hang.
- `app/Http/Controllers/API/Products/ProductController.php`: danh sach/chi tiet/CRUD san pham, upload anh, loc category/search.
- `app/Http/Controllers/API/Products/ProductReviewController.php`: them/xem review san pham.
- `app/Http/Controllers/API/Products/ProductAdvisorController.php`: chatbot AI, Qdrant search, Ollama response, thong ke shop.
- `app/Http/Controllers/API/cart/cartController.php`: gio hang, validate ton kho theo mau/size.
- `app/Http/Controllers/API/orders/OrderController.php`: tao don, chia don theo shop, tru/hoan kho, thong ke, cap nhat trang thai.

### Middleware/Kernel/Provider

- `app/Http/Kernel.php`: khai bao middleware.
- `app/Http/Middleware/Authenticate.php`: bat buoc login cho route can auth.
- `app/Http/Middleware/EncryptCookies.php`: ma hoa cookie.
- `app/Http/Middleware/PreventRequestsDuringMaintenance.php`: chan request khi maintenance.
- `app/Http/Middleware/RedirectIfAuthenticated.php`: redirect neu da login.
- `app/Http/Middleware/TrimStrings.php`: trim input string.
- `app/Http/Middleware/TrustHosts.php`: trusted host.
- `app/Http/Middleware/TrustProxies.php`: proxy.
- `app/Http/Middleware/VerifyCsrfToken.php`: CSRF cho web.
- `app/Exceptions/Handler.php`: xu ly exception.
- `app/Console/Kernel.php`: command scheduler.
- `app/Providers/AppServiceProvider.php`: service provider chinh.
- `app/Providers/AuthServiceProvider.php`: policy/auth.
- `app/Providers/BroadcastServiceProvider.php`: broadcast.
- `app/Providers/EventServiceProvider.php`: event/listener.
- `app/Providers/RouteServiceProvider.php`: route provider.

### Database migrations

- `2014_10_12_000000_create_users_table.php`: tao bang users, thong tin login, role, phone/address.
- `2014_10_12_100000_create_password_resets_table.php`: reset password.
- `2019_08_19_000000_create_failed_jobs_table.php`: failed jobs.
- `2019_12_14_000001_create_personal_access_tokens_table.php`: token Sanctum.
- `2025_10_02_142243_create_shops_table.php`: bang shops.
- `2025_11_02_161631_create_products_table.php`: bang products, gia, brand, material, colors, size_details.
- `2025_11_17_123840_create_categories_table.php`: bang categories.
- `2025_11_17_124009_create_category_product_table.php`: bang trung gian product-category.
- `2025_11_17_144541_create_product_images_table.php`: bang anh san pham.
- `2025_11_17_164847_create_minimal_carts_table.php`: bang carts ban dau.
- `2025_11_24_151552_create_orders_table.php`: bang orders.
- `2026_01_12_140035_create_product_reviews_table.php`: bang reviews.
- `2026_06_11_000001_add_color_to_carts_table.php`: them color vao carts, unique theo user/product/size/color.
- `2026_06_13_000001_create_shop_monthly_statistics_table.php`: bang thong ke shop theo thang.
- `2026_06_13_000002_add_statistics_indexes_to_orders_table.php`: index tang toc thong ke/backfill orders.

### Seeders/factories/tests/resources

- `database/seeders/DatabaseSeeder.php`: seeder tong.
- `database/seeders/UserSeeder.php`: tao user mau.
- `database/seeders/CategorySeeder.php`: tao danh muc san pham.
- `database/factories/UserFactory.php`: factory tao user test.
- `tests/TestCase.php`, `tests/CreatesApplication.php`: base test Laravel.
- `tests/Feature/ExampleTest.php`, `tests/Unit/ExampleTest.php`: test mau.
- `resources/views/welcome.blade.php`: view mac dinh Laravel.
- `resources/css/app.css`, `resources/js/app.js`, `resources/js/bootstrap.js`: asset Laravel mac dinh.
- `resources/lang/en/*.php`: ngon ngu validation/auth mac dinh.

## 4. Cac luong nghiep vu quan trong

### Dang nhap/phan quyen

1. User dang nhap o React.
2. Backend tra `access_token` va thong tin user.
3. Frontend luu token/user vao localStorage.
4. Router dieu huong theo role:
   - `admin`: trang admin.
   - `shop_owner`: trang chu cua hang.
   - `user`: trang nguoi dung.

### San pham va ton kho mau/size

1. Admin/shop tao san pham voi `size_details` dang:
   ```json
   {
     "Den": { "M": 10, "L": 5 },
     "Trang": { "S": 3 }
   }
   ```
2. Product model tu tinh `quantity`, `available_sizes`, `available_colors`.
3. Khach vao chi tiet san pham chon mau -> size con hang -> them gio.
4. Gio hang luu `product_id + color + size + quantity`.

### Dat hang

1. Khach tao don tu gio hang.
2. Backend lock san pham, kiem tra ton kho, tru dung mau/size.
3. Don duoc chia theo `shop_id`, moi shop mot order.
4. Xoa gio hang sau khi tao don.

### Huy don/hoan kho

1. Neu don bi huy, backend goi `restoreOrderInventory`.
2. Cong lai ton kho theo mau/size.
3. Giam lai `products.sold`.
4. Rebuild bang thong ke thang cua shop.

### Thong ke shop

1. Bang `shop_monthly_statistics` luu so lieu theo shop/thang.
2. `completed_orders` va `revenue` chi tinh don:
   - `status = delivered`
   - `payment_status = paid`
3. Dashboard doc bang thong ke nhanh, khong tinh lai toan bo orders moi lan.
4. Chatbot cau hoi doanh thu/don hang cung doc bang thong ke.

### Chatbot AI

1. Frontend gui cau hoi den `/chatbot/product-advice`.
2. Backend nhan dien cau hoi:
   - thong ke shop -> tra loi tu DB.
   - so luong san pham -> tra loi tu DB.
   - tu van san pham -> tim Qdrant + rerank + goi Ollama.
3. Qdrant luu vector/payload san pham.
4. Ollama tao cau tra loi dua tren context san pham.

## 5. Cau hoi phan bien co the gap va goi y tra loi

### Nhom kien truc

1. Vi sao tach frontend React va backend Laravel?
   - De tach UI va API, de mo rong mobile/app khac, backend co the phuc vu nhieu client.

2. Vi sao dung Laravel Sanctum?
   - Sanctum phu hop SPA/API token, de quan ly token dang nhap va middleware `auth:sanctum`.

3. Vi sao dung PostgreSQL?
   - Ho tro du lieu quan he tot, query thong ke on dinh, JSON/array tot cho truong nhu `order_details`, `size_details`.

4. He thong co nhung role nao?
   - `admin`, `shop_owner`, `user`. Moi role co route va quyen rieng.

5. Neu nguoi dung truy cap route khong dung role thi sao?
   - Frontend dieu huong theo role, backend route quan trong dung middleware auth va controller kiem tra role.

### Nhom san pham/ton kho

6. Vi sao ton kho luu theo mau va size?
   - Thoi trang phai quan ly bien the, cung mot san pham nhung mau/size co so luong khac nhau.

7. Cau truc `size_details` co uu/nhuoc diem gi?
   - Uu: linh hoat, de luu JSON theo mau/size. Nhuoc: kho query thong ke bien the bang SQL hon so voi bang rieng `product_variants`.

8. Neu du an mo rong, co nen tach bang variants khong?
   - Co. Nen co bang `product_variants(product_id, color, size, stock)` de query/index/report tot hon.

9. Lam sao tranh ban qua so luong ton?
   - Khi tao don, backend lock san pham, doc ton kho bien the, neu khong du thi tu choi.

10. Huy don co cap nhat lai kho khong?
   - Co, he thong cong lai ton kho mau/size va giam `sold`.

### Nhom don hang/thanh toan

11. Vi sao mot gio hang co the tao nhieu don?
   - Vi san pham co the thuoc nhieu shop, can tach moi shop mot order de chu shop quan ly rieng.

12. Khi nao tinh doanh thu?
   - Chi tinh khi don `delivered` va `payment_status = paid`.

13. Don `cancelled` va `returned` co tinh doanh thu khong?
   - Khong, va neu huy se hoan lai kho.

14. Vi sao luu `order_details` dang JSON?
   - De dong bang gia/ten/size/mau tai thoi diem dat hang, tranh san pham thay doi lam sai lich su don.

15. Nhuoc diem cua `order_details` JSON?
   - Kho query chi tiet san pham hon. Neu mo rong nen tach `order_items`.

### Nhom thong ke

16. Vi sao tao bang `shop_monthly_statistics`?
   - Giam thoi gian tinh toan moi lan mo dashboard/chatbot; dashboard doc bang tong hop nhanh hon.

17. Bang thong ke cap nhat khi nao?
   - Khi tao don, cap nhat trang thai/thanh toan, huy/tra don; rebuild theo shop va thang cua order.

18. Neu so lieu thong ke bi lech thi xu ly sao?
   - Co the rebuild lai tu bang `orders` theo shop/thang vi `orders` la source of truth.

19. Bieu do dashboard lay du lieu gi?
   - Cot: so don hoan thanh. Duong: doanh thu tu don da giao va da thanh toan.

20. Tai sao khong tinh realtime tu `orders` nua?
   - Realtime chinh xac nhung cham khi du lieu lon. Bang tong hop giam tai truy van.

### Nhom chatbot AI

21. Chatbot dung model nao?
   - Ollama voi model chat `qwen2.5:1.5b`; co the nang cap model lon hon neu may du manh.

22. Qdrant dung de lam gi?
   - Luu vector san pham de tim san pham lien quan voi cau hoi nguoi dung.

23. Chatbot co bi "bia" du lieu khong?
   - Da han che bang prompt: chi tra loi theo context DB/Qdrant, cau hoi thong ke tra loi truc tiep tu DB.

24. Cau hoi doanh thu cua shop xu ly nhu the nao?
   - Neu user la `shop_owner`, chatbot doc bang `shop_monthly_statistics` theo `shop_id` cua user.

25. Neu khach chua dang nhap hoi doanh thu shop thi sao?
   - Chatbot tu choi/bao chuc nang nay chi danh cho chu cua hang.

26. Hien tai embedding da toi uu chua?
   - Da co Qdrant, nhung neu dung hash vector thi semantic chua manh. Nen nang cap sang `nomic-embed-text`.

27. Vi sao can Qdrant neu van co SQL search?
   - SQL search tot cho keyword; Qdrant tot hon cho tim kiem theo y nghia/phong cach/nhu cau.

28. Neu Qdrant bi loi thi he thong co chet khong?
   - Khong. Controller co fallback sang scoring san pham bang DB.

### Nhom bao mat

29. API nao can dang nhap?
   - Gio hang, dat hang, lich su don, cap nhat shop, CRUD san pham shop, thong ke shop.

30. Lam sao dam bao chu shop khong sua san pham shop khac?
   - Backend loc theo `shop_id` cua user dang nhap truoc khi update/delete.

31. Token luu o dau?
   - Frontend luu token trong localStorage va gui Authorization Bearer.

32. Rủi ro localStorage la gi?
   - De bi anh huong neu XSS. Giai phap nang cao la httpOnly cookie, CSP, sanitize input.

33. API chatbot co lo du lieu shop khac khong?
   - Thong ke shop loc theo `shop_id` cua user; khong lay so lieu shop khac.

### Nhom giao dien

34. Khach chon mau/size nhu the nao?
   - Trang chi tiet doc `size_details`, hien mau con hang, sau do hien size theo mau duoc chon.

35. Vi sao them link san pham trong chatbot?
   - De tu goi y AI chuyen ngay sang chi tiet san pham, tang kha nang mua hang.

36. Dia chi nguoi dung lay tu dau?
   - Qua component `AddressSelector`, goi API dia chi de chon quoc gia/tinh/thanh pho.

37. Vi sao phone/address bat buoc?
   - Can cho giao hang, xac thuc don va lien he khach.

### Nhom kiem thu/mo rong

38. Da test nhung phan nao?
   - TypeScript type-check, PHP syntax check; can bo sung test feature cho dat hang/huy don/thong ke.

39. Neu nhieu nguoi dat cung san pham cung luc?
   - Khi tao don co `lockForUpdate` de giam race condition khi tru kho.

40. Diem yeu hien tai cua he thong?
   - `order_details` va `size_details` dang JSON, tot cho demo nhung neu mo rong nen tach bang `order_items` va `product_variants`.

41. Huong phat trien tiep theo?
   - Thanh toan online that, embedding Ollama that, notification, voucher, van chuyen, test tu dong, cache dashboard.

42. Neu model Ollama tra loi cham thi sao?
   - Tang timeout, dung model nho hon, cache cau tra loi, hoac chay model tren may/GPU tot hon.

43. Neu Qdrant collection sai vector size thi sao?
   - Phai tao lai collection dung `QDRANT_VECTOR_SIZE`, vi Qdrant khong cho upsert vector khac size.

44. Vi sao admin va shop deu co trang Products?
   - Admin quan ly toan he thong; shop owner chi quan ly san pham thuoc cua hang minh.

45. Lam sao biet so lieu moi nhat sau khi huy don?
   - Huy don goi restore inventory va rebuild thong ke shop/thang ngay trong backend.

## 6. Cac cau nen noi khi bao ve

- "Bang `orders` la source of truth, bang `shop_monthly_statistics` la bang tong hop de toi uu doc."
- "Doanh thu chi tinh khi don da giao va da thanh toan, tranh tinh sai voi don huy/tra."
- "Ton kho quan ly theo bien the mau-size vi dac thu nganh thoi trang."
- "Chatbot khong tu tinh doanh thu bang AI; cac cau thong ke lay truc tiep tu database."
- "Qdrant dung cho truy xuat san pham lien quan, Ollama dung de dien dat cau tra loi."
- "Neu mo rong production, em se tach `product_variants` va `order_items` thanh bang rieng de query tot hon."

