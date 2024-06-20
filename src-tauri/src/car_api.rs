// src/fetch.rs
pub mod car_api {
    use reqwest::Client;
    use serde::{Deserialize, Serialize};
    use anyhow::{Result, Error};  // 使用 anyhow 的 Result 和 Error

    #[derive(Serialize)]
    struct RequestBody {
        token: String,
        cjhurl: String,
    }

    #[derive(Serialize)]
    struct RequestBodyForBattery {
        token: String,
        dcbhurl: String,
    }

    #[derive(Deserialize, Debug)]
    pub struct ResponseData {
        pub code: i32,
        pub data: serde_json::Value,
    }

    pub async fn fetch_car_number(token: &str, _url: &str) -> Result<ResponseData> {
        let client = Client::new();
        let url = "http://localhost:3000/api/getCarNum";
        let body = RequestBody {
            token: token.to_string(),
            cjhurl: format!("{}", _url),
        };

        let response = client
            .post(url)
            .json(&body)
            .send()
            .await?;

        if response.status().is_success() {
            let result = response.json::<ResponseData>().await?;
            Ok(result)
        } else {
            Err(Error::msg("Failed to get a successful response"))  // 使用 anyhow 的错误构造
        }
    }

    pub async fn fetch_battery_number(token: &str, _url: &str) -> Result<ResponseData> {
        let client = Client::new();
        let url = "http://localhost:3000/api/getBatteryInfo";
        let body = RequestBodyForBattery {
            token: token.to_string(),
            dcbhurl: format!("{}", _url),
        };

        let response = client
            .post(url)
            .json(&body)
            .send()
            .await?;

        if response.status().is_success() {
            let result = response.json::<ResponseData>().await?;
            println!("{:?}", result);
            Ok(result)
        } else {
            Err(Error::msg("Failed to get a successful response"))  // 使用 anyhow 的错误构造
        }
    }
}
