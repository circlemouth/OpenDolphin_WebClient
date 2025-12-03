DELETE FROM public.tbl_uketuke WHERE hospnum=1 AND ukeymd='20251113' AND ukeid=2;
INSERT INTO public.tbl_uketuke (hospnum, ukeymd, ukeid, uketime, ptid, name, sryka, drcd, srflg, termid, opid, creymd, upymd, uphms, srynaiyo)
VALUES (1, '20251113', 2, '103000', 2, '山田太郎', '01', '00001', '00', 'WKR', 'worker', '20251113', '20251113', '182400', '00');
