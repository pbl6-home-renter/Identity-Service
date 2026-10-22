# Xác thực JWT bằng RSA

Identity-Service ký access token bằng cặp khóa RSA với thuật toán `RS256`. API Gateway và các service khác chỉ cần public key để kiểm tra token thông qua endpoint JWKS.

## Vì sao sử dụng RSA thay vì shared secret?

Với HMAC, mọi service xác thực token đều phải giữ cùng một secret dùng để ký token. Nếu một service bị lộ secret, service đó cũng có thể tự tạo token hợp lệ.

RSA tách riêng quyền ký và quyền xác thực:

- Identity-Service giữ private key và là service duy nhất được phép ký JWT.
- API Gateway và các backend service chỉ nhận public key để xác thực chữ ký.
- Nếu một service xác thực bị lộ, attacker vẫn không thể tạo token hợp lệ nếu không có private key.

## Ý nghĩa của key và các trường JWT

| Thành phần | Ý nghĩa |
| --- | --- |
| Private key | Dùng để ký JWT. Chỉ được lưu tại Identity-Service. |
| Public key | Dùng để xác thực chữ ký JWT và được expose qua JWKS. |
| `alg=RS256` | Chữ ký RSA kết hợp SHA-256. Service xác thực phải allow rõ thuật toán này. |
| `kid` | Định danh key đã dùng để ký token, hỗ trợ key rotation. |
| `iss` | Xác định service phát hành token. |
| `aud` | Xác định nhóm API được phép nhận token. |
| `exp` | Thời điểm hết hạn của token. |

## Luồng xác thực

```text
Client đăng nhập
  -> Identity-Service ký JWT bằng private key
  -> Client gửi JWT đến API Gateway
  -> Gateway đọc kid và lấy key từ /.well-known/jwks.json
  -> Gateway xác thực chữ ký, algorithm, issuer, audience và expiration
  -> Gateway chuyển tiếp request đến backend service
```

Endpoint JWKS:

```text
GET /api/v1/.well-known/jwks.json
```

Swagger khi được bật:

```text
GET /api/v1/identity/swagger
```

## Tạo cặp key RSA

Tạo private key 2048-bit và public key tương ứng:

```bash
openssl genrsa -out jwt-private.pem 2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
```

Các biến môi trường sử dụng chuỗi `\n` literal thay vì xuống dòng trực tiếp:

```env
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
JWT_KEY_ID=rentify-identity-2026-01
JWT_ISSUER=rentify-identity
JWT_AUDIENCE=rentify-api
```

## Các biến môi trường

| Biến | Ý nghĩa | Bắt buộc |
| --- | --- | --- |
| `JWT_PRIVATE_KEY` | Private key dùng để ký JWT | Có |
| `JWT_PUBLIC_KEY` | Public key dùng để verify JWT và tạo JWKS | Có |
| `JWT_KEY_ID` | Định danh của signing key hiện tại | Không |
| `JWT_ISSUER` | Giá trị claim `iss` của JWT | Không |
| `JWT_AUDIENCE` | Giá trị claim `aud` của JWT | Không |

## Cách service khác xác thực token

1. Đọc `kid` và `alg` từ JWT header.
2. Lấy public key tương ứng từ endpoint JWKS.
3. Cache response JWKS và refresh lại khi gặp `kid` chưa biết.
4. Kiểm tra thuật toán `RS256`, chữ ký, `iss`, `aud` và `exp`.
5. Từ chối token nếu thuật toán không được hỗ trợ, không tìm thấy key, claim không hợp lệ hoặc token đã hết hạn.

API Gateway và các backend service tuyệt đối không được sử dụng private key.

## Bảo mật và key rotation

- Không commit private key vào Git.
- Không log private key.
- Production nên lưu private key trong secret manager.
- Chỉ expose public key thông qua JWKS.
- Khi rotate key, tạo cặp key mới và đổi `JWT_KEY_ID`.
- Publish public key mới nhưng vẫn giữ public key cũ cho đến khi toàn bộ token được ký bằng key cũ hết hạn.
- Chỉ xóa public key cũ sau khi đã qua thời gian sống tối đa của token và khoảng thời gian clock skew.
