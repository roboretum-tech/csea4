import { CSEAInterview, InterviewBlock } from '../types';

export const CSEA_OFFICIAL_BLOCKS: InterviewBlock[] = [
  {
    idBloque: 'alineacion_estrategica',
    nombreBloque: '1. Alineación Estratégica',
    peso: 20,
    preguntas: [
      {
        idPregunta: 'ALI_P1',
        codigo: 'ALI_P1',
        tipo: 'P',
        texto: '¿La dirección puede explicar con claridad las 3–5 prioridades estratégicas vigentes?',
        senales: {
          s1: 'No puede nombrarlas o las confunde',
          s3: 'Puede nombrarlas parcialmente',
          s5: 'Las define con claridad, prioridad y lenguaje de negocio'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'ALI_P2',
        codigo: 'ALI_P2',
        tipo: 'P',
        texto: '¿Los proyectos estratégicos se justifican por su contribución directa al negocio?',
        senales: {
          s1: 'Se justifican por urgencia o presión',
          s3: 'Algunos sí, otros no',
          s5: 'La justificación estratégica es sistemática'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'ALI_P3',
        codigo: 'ALI_P3',
        tipo: 'P',
        texto: '¿La entrada de nuevas iniciativas responde a valor y no sólo a urgencia?',
        senales: {
          s1: 'Entra lo urgente',
          s3: 'Hay filtro básico',
          s5: 'Entra sólo lo justificado por valor y prioridad'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'ALI_P4',
        codigo: 'ALI_P4',
        tipo: 'P',
        texto: '¿Los cambios de prioridad están gobernados?',
        senales: {
          s1: 'Cambian sin control',
          s3: 'Cambian con cierto orden informal',
          s5: 'Cambian poco y con gobernanza clara'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'ALI_P5',
        codigo: 'ALI_P5',
        tipo: 'P',
        texto: '¿Los beneficios esperados se entienden desde el inicio?',
        senales: {
          s1: 'No se explican beneficios',
          s3: 'Se explican sólo en algunos casos',
          s5: 'Cada iniciativa crítica tiene beneficio esperado claro'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'ALI_V1',
        codigo: 'ALI_V1',
        tipo: 'V',
        texto: '¿El entrevistado puede citar el nombre del tablero, ritual o mecanismo donde se expresan las prioridades vigentes?',
        senales: {
          s1: 'No identifica ninguno',
          s3: 'Identifica uno, pero ambiguo o desactualizado',
          s5: 'Identifica mecanismo vigente, dueño y periodicidad'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'ALI_V2',
        codigo: 'ALI_V2',
        tipo: 'V',
        texto: '¿Puede describir un proyecto aprobado recientemente y explicar por qué fue prioritario?',
        senales: {
          s1: 'No recuerda un caso',
          s3: 'Recuerda un caso sin lógica completa',
          s5: 'Explica caso reciente con lógica clara de prioridad'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'ALI_V3',
        codigo: 'ALI_V3',
        tipo: 'V',
        texto: '¿Puede describir una iniciativa que se haya pausado o rechazado por falta de alineación?',
        senales: {
          s1: 'Nunca ocurre o no sabe',
          s3: 'Ocurre, pero sin criterio claro',
          s5: 'Describe caso concreto de rechazo o pausa alineado a estrategia'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'ALI_V4',
        codigo: 'ALI_V4',
        tipo: 'V',
        texto: '¿Puede explicar quién patrocina los proyectos críticos y qué resultado espera?',
        senales: {
          s1: 'No hay sponsor visible',
          s3: 'Hay sponsor nominal sin meta clara',
          s5: 'Sponsor y resultado esperado son claros y consistentes'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'ALI_V5',
        codigo: 'ALI_V5',
        tipo: 'V',
        texto: '¿Puede relatar una revisión reciente del portafolio donde se haya decidido continuar, pausar o cancelar?',
        senales: {
          s1: 'No existe ese momento',
          s3: 'Existe de forma irregular',
          s5: 'Existe y la decisión puede narrarse con claridad'
        },
        respuesta: '',
        notas: '',
        respondida: false
      }
    ]
  },
  {
    idBloque: 'priorizacion_portafolio',
    nombreBloque: '2. Priorización y Gestión del Portafolio',
    peso: 20,
    preguntas: [
      {
        idPregunta: 'PRI_P1',
        codigo: 'PRI_P1',
        tipo: 'P',
        texto: '¿La organización sabe cuántas iniciativas estratégicas activas tiene realmente?',
        senales: {
          s1: 'No lo sabe',
          s3: 'Tiene aproximación parcial',
          s5: 'Tiene conteo confiable y único'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'PRI_P2',
        codigo: 'PRI_P2',
        tipo: 'P',
        texto: '¿Los criterios para definir prioridad son claros y compartidos?',
        senales: {
          s1: 'No existen',
          s3: 'Existen pero son básicos',
          s5: 'Son claros, compartidos y usados'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'PRI_P3',
        codigo: 'PRI_P3',
        tipo: 'P',
        texto: '¿Antes de iniciar una iniciativa se valida capacidad real para ejecutarla?',
        senales: {
          s1: 'Nunca se valida',
          s3: 'Se valida a veces',
          s5: 'Se valida sistemáticamente'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'PRI_P4',
        codigo: 'PRI_P4',
        tipo: 'P',
        texto: '¿Los proyectos detenidos o "zombi" se identifican oportunamente?',
        senales: {
          s1: 'No se detectan',
          s3: 'Se detectan tarde',
          s5: 'Se detectan y redeciden rápido'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'PRI_P5',
        codigo: 'PRI_P5',
        tipo: 'P',
        texto: '¿La organización puede pausar, secuenciar o rechazar iniciativas cuando es necesario?',
        senales: {
          s1: 'No puede decir no',
          s3: 'Lo hace parcialmente',
          s5: 'Lo hace con criterio y oportunidad'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'PRI_V1',
        codigo: 'PRI_V1',
        tipo: 'V',
        texto: '¿El entrevistado puede decir cuántas iniciativas activas existen hoy y en qué orden de prioridad?',
        senales: {
          s1: 'No puede',
          s3: 'Da un número aproximado',
          s5: 'Da cifra y lógica de priorización consistentes'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'PRI_V2',
        codigo: 'PRI_V2',
        tipo: 'V',
        texto: '¿Puede explicar con qué criterio una iniciativa entra al portafolio?',
        senales: {
          s1: 'No hay criterio',
          s3: 'Hay criterio genérico',
          s5: 'Hay criterio de valor/capacidad claramente verbalizable'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'PRI_V3',
        codigo: 'PRI_V3',
        tipo: 'V',
        texto: '¿Puede describir un caso reciente de secuenciación, pausa o rechazo?',
        senales: {
          s1: 'No existe',
          s3: 'Hay ejemplo incompleto',
          s5: 'Hay caso claro con causa y decisión'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'PRI_V4',
        codigo: 'PRI_V4',
        tipo: 'V',
        texto: '¿Puede señalar cuántos proyectos están detenidos, sin sponsor o sin tracción real?',
        senales: {
          s1: 'No lo sabe',
          s3: 'Menciona algunos',
          s5: 'Tiene una visión clara y actual'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'PRI_V5',
        codigo: 'PRI_V5',
        tipo: 'V',
        texto: '¿Puede explicar cómo se compara demanda versus capacidad antes de aceptar nuevas iniciativas?',
        senales: {
          s1: 'Nunca se compara',
          s3: 'Se compara de forma informal',
          s5: 'Se compara explícitamente y condiciona decisiones'
        },
        respuesta: '',
        notas: '',
        respondida: false
      }
    ]
  },
  {
    idBloque: 'gobernanza_decisiones',
    nombreBloque: '3. Gobernanza y Toma de Decisiones',
    peso: 20,
    preguntas: [
      {
        idPregunta: 'GOB_P1',
        codigo: 'GOB_P1',
        tipo: 'P',
        texto: '¿Está clara la autoridad para decidir sobre proyectos estratégicos?',
        senales: {
          s1: 'No está clara',
          s3: 'Está clara en algunos casos',
          s5: 'Está clara y entendida por los actores'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'GOB_P2',
        codigo: 'GOB_P2',
        tipo: 'P',
        texto: '¿Existen foros regulares y útiles para revisar y decidir?',
        senales: {
          s1: 'No existen',
          s3: 'Existen pero con eficacia parcial',
          s5: 'Existen y son eficaces'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'GOB_P3',
        codigo: 'GOB_P3',
        tipo: 'P',
        texto: '¿Las decisiones críticas se toman con velocidad razonable?',
        senales: {
          s1: 'Se estancan',
          s3: 'Tiempos mixtos',
          s5: 'Se toman oportunamente'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'GOB_P4',
        codigo: 'GOB_P4',
        tipo: 'P',
        texto: '¿Los riesgos y bloqueos pueden escalarse con claridad?',
        senales: {
          s1: 'No hay ruta',
          s3: 'Hay escalamiento parcial',
          s5: 'La ruta es clara y utilizada'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'GOB_P5',
        codigo: 'GOB_P5',
        tipo: 'P',
        texto: '¿Los acuerdos ejecutivos se siguen hasta cierre?',
        senales: {
          s1: 'No se siguen',
          s3: 'Seguimiento básico',
          s5: 'Seguimiento trazable y puntual'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'GOB_V1',
        codigo: 'GOB_V1',
        tipo: 'V',
        texto: '¿Puede describirse un caso reciente de decisión crítica: quién decidió, en cuánto tiempo y qué ocurrió después?',
        senales: {
          s1: 'No se puede describir',
          s3: 'Hay caso, pero incompleto',
          s5: 'Se narra de principio a fin con claridad'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'GOB_V2',
        codigo: 'GOB_V2',
        tipo: 'V',
        texto: '¿El entrevistado puede nombrar foros de gobernanza, frecuencia y participantes?',
        senales: {
          s1: 'No puede',
          s3: 'Puede parcialmente',
          s5: 'Puede con precisión y consistencia'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'GOB_V3',
        codigo: 'GOB_V3',
        tipo: 'V',
        texto: '¿Puede explicar cómo se eleva un proyecto en rojo?',
        senales: {
          s1: 'No existe ruta',
          s3: 'Existe de manera informal',
          s5: 'Existe ruta definida y entendida'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'GOB_V4',
        codigo: 'GOB_V4',
        tipo: 'V',
        texto: '¿Puede citar un acuerdo ejecutivo reciente y cómo se le dio seguimiento?',
        senales: {
          s1: 'No recuerda ninguno',
          s3: 'Recuerda uno sin trazabilidad',
          s5: 'Recuerda uno con responsable y cierre'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'GOB_V5',
        codigo: 'GOB_V5',
        tipo: 'V',
        texto: '¿Puede distinguir roles de sponsor, líder de proyecto, PM y comité?',
        senales: {
          s1: 'Los confunde',
          s3: 'Los distingue parcialmente',
          s5: 'Los distingue con claridad funcional'
        },
        respuesta: '',
        notas: '',
        respondida: false
      }
    ]
  },
  {
    idBloque: 'disciplina_ejecucion',
    nombreBloque: '4. Disciplina de Ejecución',
    peso: 15,
    preguntas: [
      {
        idPregunta: 'DIS_P1',
        codigo: 'DIS_P1',
        tipo: 'P',
        texto: '¿Los proyectos críticos arrancan con planeación realista de alcance, fecha y costo?',
        senales: {
          s1: 'No arrancan así',
          s3: 'Algunos sí',
          s5: 'Es una práctica consistente'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'DIS_P2',
        codigo: 'DIS_P2',
        tipo: 'P',
        texto: '¿El avance real se revisa contra un plan base?',
        senales: {
          s1: 'No se revisa',
          s3: 'Se revisa parcialmente',
          s5: 'Se revisa de forma disciplinada'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'DIS_P3',
        codigo: 'DIS_P3',
        tipo: 'P',
        texto: '¿Los riesgos y problemas se detectan antes de volverse críticos?',
        senales: {
          s1: 'Se detectan tarde',
          s3: 'Se detectan a veces',
          s5: 'Se detectan tempranamente'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'DIS_P4',
        codigo: 'DIS_P4',
        tipo: 'P',
        texto: '¿Los cambios de alcance, fecha y costo se controlan?',
        senales: {
          s1: 'No se controlan',
          s3: 'Se controlan a veces',
          s5: 'Se controlan sistemáticamente'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'DIS_P5',
        codigo: 'DIS_P5',
        tipo: 'P',
        texto: '¿Los compromisos principales se cumplen con previsibilidad razonable?',
        senales: {
          s1: 'No hay previsibilidad',
          s3: 'Previsibilidad intermedia',
          s5: 'Alta previsibilidad'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'DIS_V1',
        codigo: 'DIS_V1',
        tipo: 'V',
        texto: '¿Puede explicarse cómo se define el "plan base" de un proyecto crítico?',
        senales: {
          s1: 'No existe o no se entiende',
          s3: 'Existe parcialmente',
          s5: 'Se entiende con claridad operacional'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'DIS_V2',
        codigo: 'DIS_V2',
        tipo: 'V',
        texto: '¿Puede describirse cómo se revisa un avance semanal o mensual contra metas?',
        senales: {
          s1: 'No hay mecánica',
          s3: 'Hay mecánica parcial',
          s5: 'Hay mecánica clara y repetible'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'DIS_V3',
        codigo: 'DIS_V3',
        tipo: 'V',
        texto: '¿Puede narrarse un riesgo reciente detectado a tiempo y la acción tomada?',
        senales: {
          s1: 'No hay ejemplo',
          s3: 'Hay ejemplo ambiguo',
          s5: 'Hay caso concreto y útil'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'DIS_V4',
        codigo: 'DIS_V4',
        tipo: 'V',
        texto: '¿Puede describirse un cambio reciente de alcance o fecha y cómo se aprobó?',
        senales: {
          s1: 'Cambia sin control',
          s3: 'Hay control parcial',
          s5: 'Hubo control claro y decisión trazable'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'DIS_V5',
        codigo: 'DIS_V5',
        tipo: 'V',
        texto: '¿Puede estimarse, aunque sea de forma ejecutiva, qué porcentaje de proyectos termina en tiempo y presupuesto?',
        senales: {
          s1: 'No puede estimarse',
          s3: 'Hay percepción aproximada',
          s5: 'Existe una estimación razonable y consistente'
        },
        respuesta: '',
        notas: '',
        respondida: false
      }
    ]
  },
  {
    idBloque: 'capacidad_organizacional',
    nombreBloque: '5. Capacidad Organizacional',
    peso: 15,
    preguntas: [
      {
        idPregunta: 'CAP_P1',
        codigo: 'CAP_P1',
        tipo: 'P',
        texto: '¿Los recursos y líderes clave están realmente disponibles para las prioridades?',
        senales: {
          s1: 'No lo están',
          s3: 'Algunos sí',
          s5: 'Sí, de forma suficiente'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'CAP_P2',
        codigo: 'CAP_P2',
        tipo: 'P',
        texto: '¿La carga y multitarea de recursos críticos es manejable?',
        senales: {
          s1: 'No es manejable',
          s3: 'Es irregular',
          s5: 'Es manejable y monitoreada'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'CAP_P3',
        codigo: 'CAP_P3',
        tipo: 'P',
        texto: '¿Están identificados los cuellos de botella por roles o áreas?',
        senales: {
          s1: 'No están claros',
          s3: 'Se conocen parcialmente',
          s5: 'Se conocen y se gestionan'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'CAP_P4',
        codigo: 'CAP_P4',
        tipo: 'P',
        texto: '¿Existe continuidad suficiente si un recurso clave se ausenta o sale?',
        senales: {
          s1: 'No existe',
          s3: 'Existe de forma parcial',
          s5: 'Existe con razonable seguridad'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'CAP_P5',
        codigo: 'CAP_P5',
        tipo: 'P',
        texto: '¿La organización puede mover recursos hacia prioridades críticas con rapidez?',
        senales: {
          s1: 'No puede',
          s3: 'Puede a veces',
          s5: 'Puede con criterio y rapidez'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'CAP_V1',
        codigo: 'CAP_V1',
        tipo: 'V',
        texto: '¿Puede describirse cuántos proyectos atiende al mismo tiempo un recurso crítico típico?',
        senales: {
          s1: 'No se sabe',
          s3: 'Hay aproximación',
          s5: 'Hay conciencia clara de la carga'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'CAP_V2',
        codigo: 'CAP_V2',
        tipo: 'V',
        texto: '¿Puede identificarse el principal cuello de botella actual?',
        senales: {
          s1: 'No se identifica',
          s3: 'Se identifica vagamente',
          s5: 'Se identifica y se explica su impacto'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'CAP_V3',
        codigo: 'CAP_V3',
        tipo: 'V',
        texto: '¿Puede explicarse qué ocurre si una persona clave sale del proyecto?',
        senales: {
          s1: 'No hay respuesta',
          s3: 'Hay respuesta parcial',
          s5: 'Hay suplencia o continuidad razonable'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'CAP_V4',
        codigo: 'CAP_V4',
        tipo: 'V',
        texto: '¿Puede citarse un caso reciente de reasignación de capacidad hacia una prioridad crítica?',
        senales: {
          s1: 'No existe',
          s3: 'Existe, pero improvisado',
          s5: 'Existe y responde a criterio claro'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'CAP_V5',
        codigo: 'CAP_V5',
        tipo: 'V',
        texto: '¿Puede describirse cómo se coordinan áreas o líderes cuando comparten recursos?',
        senales: {
          s1: 'No se describe',
          s3: 'Se describe parcialmente',
          s5: 'Se describe de forma estructurada y coherente'
        },
        respuesta: '',
        notas: '',
        respondida: false
      }
    ]
  },
  {
    idBloque: 'visibilidad_control',
    nombreBloque: '6. Visibilidad y Control Ejecutivo',
    peso: 10,
    preguntas: [
      {
        idPregunta: 'VIS_P1',
        codigo: 'VIS_P1',
        tipo: 'P',
        texto: '¿La dirección recibe visibilidad suficiente del estado del portafolio?',
        senales: {
          s1: 'No la recibe',
          s3: 'La recibe parcialmente',
          s5: 'La recibe de forma clara y suficiente'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'VIS_P2',
        codigo: 'VIS_P2',
        tipo: 'P',
        texto: '¿La información presentada es confiable y oportuna?',
        senales: {
          s1: 'No es confiable',
          s3: 'Es mixtamente confiable',
          s5: 'Es confiable y oportuna'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'VIS_P3',
        codigo: 'VIS_P3',
        tipo: 'P',
        texto: '¿Los riesgos críticos se vuelven visibles antes de materializarse?',
        senales: {
          s1: 'No',
          s3: 'A veces',
          s5: 'Sí, de forma temprana'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'VIS_P4',
        codigo: 'VIS_P4',
        tipo: 'P',
        texto: '¿Los reportes ayudan a decidir y no sólo a informar?',
        senales: {
          s1: 'No ayudan',
          s3: 'Ayudan parcialmente',
          s5: 'Son accionables'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'VIS_P5',
        codigo: 'VIS_P5',
        tipo: 'P',
        texto: '¿Los indicadores y semáforos se usan con lógica consistente entre iniciativas?',
        senales: {
          s1: 'No hay consistencia',
          s3: 'Hay consistencia parcial',
          s5: 'La lógica es consistente y comparable'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'VIS_V1',
        codigo: 'VIS_V1',
        tipo: 'V',
        texto: '¿El entrevistado puede explicar qué ve hoy un director al revisar el portafolio?',
        senales: {
          s1: 'No puede',
          s3: 'Puede dar visión parcial',
          s5: 'Puede describir la vista ejecutiva con claridad'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'VIS_V2',
        codigo: 'VIS_V2',
        tipo: 'V',
        texto: '¿Puede decir con qué frecuencia se actualiza la información y quién la consolida?',
        senales: {
          s1: 'No lo sabe',
          s3: 'Lo sabe parcialmente',
          s5: 'Lo sabe y resulta consistente'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'VIS_V3',
        codigo: 'VIS_V3',
        tipo: 'V',
        texto: '¿Puede identificar qué proyectos están "en rojo" y por qué?',
        senales: {
          s1: 'No puede',
          s3: 'Puede parcialmente',
          s5: 'Puede con claridad causal'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'VIS_V4',
        codigo: 'VIS_V4',
        tipo: 'V',
        texto: '¿Puede explicar qué decisión ejecutiva reciente surgió de un reporte?',
        senales: {
          s1: 'No hay ejemplo',
          s3: 'Hay ejemplo débil',
          s5: 'Hay ejemplo claro y útil'
        },
        respuesta: '',
        notas: '',
        respondida: false
      },
      {
        idPregunta: 'VIS_V5',
        codigo: 'VIS_V5',
        tipo: 'V',
        texto: '¿Puede describir la lógica de semáforos o KPIs entre proyectos?',
        senales: {
          s1: 'No existe o es arbitraria',
          s3: 'Existe parcialmente',
          s5: 'Existe y se aplica de manera comparable'
        },
        respuesta: '',
        notas: '',
        respondida: false
      }
    ]
  }
];

export function getDefaultCSEAInterview(): CSEAInterview {
  return {
    estado: 'generada',
    generadaEn: new Date().toISOString(),
    modeloUsado: 'CSEA 3.2 Matriz Oficial',
    bloques: JSON.parse(JSON.stringify(CSEA_OFFICIAL_BLOCKS))
  };
}
