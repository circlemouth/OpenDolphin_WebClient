INSERT INTO public.tbl_ptnum_public (hospnum, ptid, patient_id_1, termid, opid, creymd, upymd, uphms, agreement)
VALUES (1, 2, '00002', 'WKR', 'worker', '20251113', '20251113', '181210', '1')
ON CONFLICT (hospnum, ptid) DO UPDATE
  SET patient_id_1 = excluded.patient_id_1,
      upymd = excluded.upymd,
      uphms = excluded.uphms;

INSERT INTO public.tbl_ptnum_public (hospnum, ptid, patient_id_1, termid, opid, creymd, upymd, uphms, agreement)
VALUES (1, 3, '0000003', 'WKR', 'worker', '20251113', '20251113', '181220', '1')
ON CONFLICT (hospnum, ptid) DO UPDATE
  SET patient_id_1 = excluded.patient_id_1,
      upymd = excluded.upymd,
      uphms = excluded.uphms;
