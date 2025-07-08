select * from bimart.vendors 


select * from bimart.dwd_outbound_order limit 100;



select *
from bimart.dwd_outbound_order 
where 1=1
    and basis_dt >= '2025-05-01'
order by outbound_order_id  limit 10000;



select * from bimart.dwf_vendor_workplace limit 100;


select count(*) from bimart.dwd_outbound_order where basis_dt >= '2025-01-01'


