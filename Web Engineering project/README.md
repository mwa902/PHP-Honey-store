# Honey Sugar Bakery — Web Engineering Project

## Run with XAMPP (PHP + MySQL)

1. Start **Apache** and **MySQL** in XAMPP Control Panel.
2. Open the site:
   - Store: `http://localhost/official%20java%20honey/Web%20Engineering%20project/home/home.html`
   - Admin login: `http://localhost/official%20java%20honey/Web%20Engineering%20project/login.php` (use Admin tab)
   - Demo admin: `admin@honeysugar.com` / `Admin@123`
     Admin@987

See `database/README.md` for table changes and what to add/remove in MySQL.

Admin Login:
Username: Admin
Password: Admin@9876

Customer:
Just signup and order
if wanna check

UserName:
Abbas
password:
hash_abbas

## Site map

Promo Code:

- <p class="promo-hint">Try: HONEY10 · SWEET15 · FLAT200 · WELCOME5</p>

| Page            | Path                                           |
| --------------- | ---------------------------------------------- |
| Home            | `home/home.html`                               |
| Products        | `product/product.html`                         |
| Product detail  | `product/product_detail.html?product=cinnamon` |
| About           | `about/about.html`                             |
| Checkout        | `Cart checkout/checkout.html`                  |
| Login           | `login.php`                                    |
| Admin login     | `login.php` (same Login)                       |
| Admin dashboard | `admin/admin.php`                              |
| Sign up         | `signup/signup.html`                           |
| Admin           | `admin/admin.html`                             |

## Cart

All storefront pages share the `honey_cart` key in `localStorage`. Add items on the Products page, then checkout.

Shared scripts: `js/cart-shared.js`, `js/cart-shared.css`

## Images to add

Place product and hero images in the folders referenced by HTML/JS (e.g. `home/`, `product/`). Until then, broken images may show fallback icons.
