# planilha FALSA com os mesmos títulos e os mesmos defeitos da planilha real de alunos ativos
import sys, datetime, openpyxl
def cpf_valido(base9):
    d = [int(x) for x in base9]
    for n in (10, 11):
        s = sum(v * (n - i) for i, v in enumerate(d)); r = (s * 10) % 11; d.append(0 if r == 10 else r)
    return ''.join(map(str, d))
cab = ['Endereço de e-mail','Nome Completo','Data de nascimento','CPF:','Telefone (Whatsapp de preferência)','Qual o motivo principal de sua procura pelo Yoga?',
 'Já fez aulas de yoga ou outra atividade física online?','Já praticou ou pratica Yoga?','Como está sua pressão arterial?','Você sente dores na coluna? Se sim, em que região?',
 'Você sente dores...? Se sim, descreva brevemente.','Como está o funcionamento do seu intestino? (funciona todos os dias, mais de uma vez ao dia ou quantas vezes na semana)',
 'Tem labirintite, tonturas ou algo do gênero?','Como você considera sua saúde física e mental?','Mais alguma informação importante (uso de medicação, tratamento de saúde, cirurgias realizadas)?',
 'Declaro estar ciente e concordar com os termos de responsabilidade que me foram enviados.','Nome e grau de parentesco','Telefone','Pontuação',
 'AUTORIZO SEM QUALQUER ÔNUS ECONÔMICO/FINANCEIRO extra ao Espaço Anirvana, utilizar a imagem de minha pessoa...']
c1 = cpf_valido('012345678')          # começa com zero: o Excel guarda como número e perde o zero
c2 = cpf_valido('987654321'); c3 = cpf_valido('321654987'); c4 = cpf_valido('246813579')
D = datetime.datetime
linhas = [
 ['ana.teste@example.com','Ana Teste Exemplo',D(1990,5,4),int(c1),41999990001,'Autoconhecimento','','Sim','Normal','Não','Não','Todos os dias','Não','Boa','Não','Sim, declaro estar ciente e concordo com os termos.','Rui - marido',41999990002,None,'Sim, autorizo.'],
 ['bia.teste@example.com','BEATRIZ DE TESTE FALSO',D(1979,1,10),int(c2),'999990003','Complementar a terapia','Não','Sim.','Normal','Não','Dor no pé','Mais de uma vez no dia','Não','Boa','Cirurgia no pé','Sim, declaro estar ciente e concordo com os termos.','','',None,''],
 ['caio.teste@example.com','Caio Teste',D(1988,12,15),int(c3),'419999-0004','Por causa da esposa','','Sim','Alta','Sim. Lombar','Não','Todos dias','Não','Boa','Remédio para pressão','Sim, declaro estar ciente e concordo com os termos.','Lia, esposa','41999990005',None,'Sim, autorizo.'],
 ['dani.teste@example.com','Dani Teste',D(1982,2,5),int(c4),'45 999990006','Saúde','Sim','Sim','Normal','Não','Não','Bem','Não','Boa','Não','Sim, declaro estar ciente e concordo com os termos.','Teo - irmão','45999990007',None,'Sim, autorizo.'],
 ['ana.teste@example.com','Ana Teste Exemplo',D(1990,5,4),int(c1),41999990001,'Autoconhecimento','','Sim','Normal','Não','Não','Todos os dias','Não','Boa','Não','Sim, declaro estar ciente e concordo com os termos.','Rui - marido',41999990002,None,'Sim, autorizo.'],
]
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Plan1'; ws.append(cab + [None]*6)
for l in linhas: ws.append(l)
wb.create_sheet('Plan2'); wb.create_sheet('Plan3')
wb.save(sys.argv[1]); print('fixture', sys.argv[1], 'cpfs', c1, c2, c3, c4)
