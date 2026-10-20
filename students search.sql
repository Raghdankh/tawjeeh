-- بحث أسماء الطالبات في نموذج الإحالة (للمعلمات بعد الدخول فقط)
create or replace function public.masar_norm(t text) returns text
language sql immutable set search_path = public as $$
  select regexp_replace(translate(coalesce(t, ''), 'أإآةى', 'اااهي'), '\s+', ' ', 'g');
$$;

create or replace function public.masar_student_search(p_tid bigint, p_pin text, p_q text)
returns json language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v text := public.masar_teacher_ok(p_tid, p_pin);
  q text := trim(public.masar_norm(p_q));
begin
  if v <> 'ok' then return json_build_object('error', v); end if;
  if length(q) < 2 then return json_build_object('ok', true, 'rows', '[]'::json); end if;
  return json_build_object('ok', true, 'rows', coalesce((
    select json_agg(x) from (
      select d.data ->> 'name' as name, coalesce(d.data ->> 'grade', '') as grade, coalesce(d.data ->> 'section', '') as section
      from public.platform_docs d
      where d.kind = 'student'
        and not exists (select 1 from unnest(string_to_array(q, ' ')) w where position(w in public.masar_norm(d.data ->> 'name')) = 0)
      order by (public.masar_norm(d.data ->> 'name') like q || '%') desc, d.data ->> 'name'
      limit 8) x), '[]'::json));
end $$;

revoke execute on function public.masar_student_search(bigint,text,text) from public;
grant execute on function public.masar_student_search(bigint,text,text) to anon, authenticated;
