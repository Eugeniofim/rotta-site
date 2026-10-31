-- Calendário de temporada (coleção `disponibilidade` da tabela itens da sala ad7).
-- A dona grava (política itens_dona, já existe); o SITE precisa LER sem login:
drop policy if exists itens_disponibilidade_publica on ad7.itens;
create policy itens_disponibilidade_publica on ad7.itens for select to anon, authenticated
  using (colecao = 'disponibilidade' and apagado = false);
grant select on ad7.itens to anon;
select 'calendário de temporada liberado para leitura pública' as status;
