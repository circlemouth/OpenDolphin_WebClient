-- RUN_ID=20251124T130000Z (ORCA-06 seed template)
-- 保険者 / 住所

BEGIN;

-- 住所 (TBL_ADRS)
INSERT INTO TBL_ADRS (zip, pref_code, city_code, city, town, kana, roman, full_address, start_date, end_date)
VALUES ('1000001', '13', '13101', '千代田区', '千代田', 'チヨダク チヨダ', 'Chiyoda-ku Chiyoda', '東京都千代田区千代田', '20240401', '99991231');

-- 保険者 (TBL_HKNJAINF)
INSERT INTO TBL_HKNJAINF (hknjanum, hknjaname, hknjakbn, hknjafutankeiritsu, pref_code, city_code, zip, address, tel, start_date, end_date)
VALUES ('06123456', '札幌市国民健康保険', 1, 0.7, '01', '01100', '0600001', '北海道札幌市中央区北一条西2', '011-123-4567', '20240401', '99991231');

COMMIT;
