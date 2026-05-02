Endpoint created for payment initiation.

Behavior:
- Uses Midtrans when `PAYMENT_MODE=midtrans` and `MIDTRANS_SERVER_KEY` is available.
- Falls back to dummy checkout when `PAYMENT_MODE=dummy` or Midtrans credentials are missing.
- Sends buyers to the internal manual transfer page when `PAYMENT_MODE=manual`.
- Uses Pakasir hosted checkout links when `PAYMENT_MODE=pakasir` and Pakasir credentials are available.
- Builds checkout and finish URLs from the current request origin, so production deployments do not need a localhost base URL.