# Pin npm packages by running ./bin/importmap

pin "application"
pin "mobile"
pin_all_from "app/javascript/mobile", under: "mobile"
