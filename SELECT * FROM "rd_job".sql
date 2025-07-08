SELECT * FROM "rd_job"."amr_job_lifecycle_action_log" LIMIT 10000


select 
    vw.workplace_name,
    vd.vendor_name,
    sku.sku_name,
    sku.barcode
    sum(oos.completed_quantity) as ob_quantity
from bimart.dwd_outbound_order_sku oos 
join bimart.dwd_sku_v2 sku on sku.sku_id = oos.sku_id
join bimart.dwf_vendor_workplace vw on vw.workplace_id = oos.workplace_id
join bimart.vendors vd on vd.vendor_id = oos.vendor_id
where 1=1 
    and oos.basis_dt > '2025-05-11'
    and date(oos.ob_completed_at + interval '9' hour) between date('2025-06-01') and date('2025-06-30')
    and oos.workplace_id in (123, 4689)
    and oos.outbound_order_state = 'OUTBOUND_COMPLETED'
group by 1,2,3,4