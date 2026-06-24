import type { AuditStructure } from '@/types/audit'

export const AUDIT_STRUCTURE: AuditStructure = {
  areas: [
    {
      id: 'salon',
      label: 'Salón',
      categories: [
        {
          id: 'salon-exterior',
          label: 'Exterior',
          weight: 15,
          items: [
            {
              id: 'ext-1',
              label: 'Fachada limpia y en buen estado',
              description: 'Verificar que la fachada esté libre de suciedad, grafitis y daños visibles',
              suggestions: {
                2: 'Fachada impecable, pintura en excelente estado',
                1: 'Fachada en condiciones aceptables',
                [-1]: 'Se observan manchas/suciedad en la fachada',
                [-2]: 'Fachada en muy mal estado, requiere atención urgente',
              },
            },
            {
              id: 'ext-2',
              label: 'Letrero visible e iluminado',
              description: 'El letrero del establecimiento debe estar visible y funcionando',
              suggestions: {
                2: 'Letrero perfectamente visible e iluminación completa',
                1: 'Letrero visible con iluminación funcional',
                [-1]: 'Letrero parcialmente visible o iluminación deficiente',
                [-2]: 'Letrero no visible o sin iluminación',
              },
            },
            {
              id: 'ext-3',
              label: 'Área de entrada limpia',
              description: 'La entrada debe estar libre de basura y obstáculos',
              suggestions: {
                2: 'Entrada impecable y muy acogedora',
                1: 'Entrada limpia y despejada',
                [-1]: 'Se observa basura o suciedad en la entrada',
                [-2]: 'Entrada muy sucia o con obstáculos',
              },
            },
            {
              id: 'ext-4',
              label: 'Cartelería exhibida de forma correcta?',
              description: 'Promociones de marketing, cartelería obligatoria propuesta por la marca y fileteado de marca exhibidos correctamente.',
              suggestions: {
                2: 'Toda la cartelería está completa, actualizada, limpia, bien ubicada y el fileteado de marca se encuentra en excelente estado.',
                1: 'La cartelería obligatoria y promocional está exhibida correctamente y el fileteado se encuentra en condiciones aceptables.',
                [-1]: 'Falta cartelería obligatoria/promocional, está desactualizada, mal ubicada o el fileteado presenta deterioro visible.',
                [-2]: 'No hay cartelería obligatoria de marca, la comunicación visual está ausente o deteriorada de forma importante.',
              },
            },
          ],
        },
        {
          id: 'salon-general',
          label: 'Salón General',
          weight: 27,
          items: [
            {
              id: 'sal-1',
              label: 'Mesas y sillas limpias y en buen estado',
              description: 'Mesas y sillas limpias, estables, sin daños visibles y aptas para la atención al cliente.',
              weight: 2, // Combined weight of old sal-1 and sal-2
              suggestions: {
                2: 'Todas las mesas y sillas están limpias, estables, sin daños y con excelente presentación.',
                1: 'Mesas y sillas están limpias y en buen estado general, sin afectar la experiencia del cliente.',
                [-1]: 'Hay mesas o sillas sucias, inestables, dañadas o con desgaste visible.',
                [-2]: 'Hay mesas o sillas rotas, inseguras, muy sucias o que no deberían estar disponibles para clientes.',
              },
            },
            // sal-2 merged into sal-1 - keeping ID reference for historical data
            {
              id: 'sal-3',
              label: 'Piso limpio y en buen estado',
              description: 'El piso debe estar limpio y sin daños',
              suggestions: {
                2: 'Piso impecable y brillante',
                1: 'Piso limpio y en buenas condiciones',
                [-1]: 'Piso con manchas o suciedad visible',
                [-2]: 'Piso muy sucio o dañado',
              },
            },
            {
              id: 'sal-4',
              label: 'Iluminación adecuada',
              description: 'La iluminación debe ser suficiente y funcional',
              suggestions: {
                2: 'Iluminación perfecta y ambiente agradable',
                1: 'Iluminación adecuada',
                [-1]: 'Algunas luces no funcionan',
                [-2]: 'Iluminación muy deficiente',
              },
            },
            {
              id: 'sal-5',
              label: 'Decoración en buen estado',
              description: 'Elementos decorativos limpios y bien colocados',
              suggestions: {
                2: 'Decoración impecable y atractiva',
                1: 'Decoración en buenas condiciones',
                [-1]: 'Decoración deteriorada o sucia',
                [-2]: 'Decoración muy deteriorada o faltante',
              },
            },
            {
              id: 'sal-6',
              label: 'Temperatura ambiente confortable',
              description: 'El ambiente debe tener temperatura agradable',
              suggestions: {
                2: 'Temperatura perfecta y confortable',
                1: 'Temperatura aceptable',
                [-1]: 'Temperatura incómoda (muy caliente o frío)',
                [-2]: 'Temperatura extrema, afecta la experiencia',
              },
            },
          ],
        },
        {
          id: 'salon-barra',
          label: 'Barra',
          weight: 15,
          items: [
            {
              id: 'bar-1',
              label: 'Barra limpia y organizada',
              description: 'La barra debe estar limpia y con productos ordenados',
              suggestions: {
                2: 'Barra impecable y muy bien organizada',
                1: 'Barra limpia y ordenada',
                [-1]: 'Barra con suciedad o desorganizada',
                [-2]: 'Barra muy sucia o en desorden total',
              },
            },
            {
              id: 'bar-2',
              label: 'Equipo de bebidas funcionando',
              description: 'Máquinas de bebidas operativas',
              suggestions: {
                2: 'Todo el equipo funcionando perfectamente',
                1: 'Equipo funcional',
                [-1]: 'Algún equipo con fallas menores',
                [-2]: 'Equipo crítico sin funcionar',
              },
            },
            {
              id: 'bar-3',
              label: 'Productos exhibidos correctamente',
              description: 'Productos visibles y bien presentados',
              suggestions: {
                2: 'Exhibición excelente y atractiva',
                1: 'Productos bien exhibidos',
                [-1]: 'Exhibición desordenada',
                [-2]: 'Productos no exhibidos o muy desordenados',
              },
            },
          ],
        },
        {
          id: 'salon-farmacia',
          label: 'Farmacia',
          weight: 4,
          items: [
            {
              id: 'far-1',
              label: 'Área de farmacia ordenada',
              description: 'Se encuentra limpia y ordenada? Cuenta con la vajilla especial para sin TACC?',
              suggestions: {
                2: 'El área está limpia, ordenada, completa y con vajilla sin TACC identificada, separada y disponible.',
                1: 'El área está limpia y ordenada, con vajilla sin TACC disponible.',
                [-1]: 'El área está desordenada, incompleta o la vajilla sin TACC no está correctamente identificada/disponible.',
                [-2]: 'El área está sucia, desorganizada o no cuenta con vajilla sin TACC, generando riesgo operativo.',
              },
            },
            {
              id: 'far-2',
              label: 'Vajilla completa para la operación?',
              description: 'Disponibilidad suficiente de vajilla, cubiertos, condimentos y elementos necesarios para operar correctamente.',
              suggestions: {
                2: 'La vajilla y elementos de operación están completos, ordenados, limpios y disponibles en cantidad suficiente.',
                1: 'La vajilla y elementos necesarios están disponibles para operar con normalidad.',
                [-1]: 'Falta vajilla, cubiertos o elementos necesarios, afectando parcialmente la operación.',
                [-2]: 'La falta de vajilla o elementos básicos compromete directamente la operación del local.',
              },
            },
          ],
        },
        {
          id: 'salon-banos',
          label: 'Baños',
          weight: 12,
          items: [
            {
              id: 'ban-1',
              label: 'Baños limpios',
              description: 'Los baños deben estar limpios y sin olores',
              suggestions: {
                2: 'Baños impecables y con aroma agradable',
                1: 'Baños limpios',
                [-1]: 'Baños con suciedad visible',
                [-2]: 'Baños muy sucios o con olores fuertes',
              },
            },
            {
              id: 'ban-2',
              label: 'Papel higiénico disponible',
              description: 'Debe haber papel higiénico suficiente',
              suggestions: {
                2: 'Papel higiénico abundante',
                1: 'Papel higiénico disponible',
                [-1]: 'Papel higiénico escaso',
                [-2]: 'Sin papel higiénico',
              },
            },
            {
              id: 'ban-3',
              label: 'Jabón disponible',
              description: 'Dispensadores de jabón funcionando',
              suggestions: {
                2: 'Jabón abundante y dispensadores en perfecto estado',
                1: 'Jabón disponible',
                [-1]: 'Jabón escaso',
                [-2]: 'Sin jabón',
              },
            },
            {
              id: 'ban-4',
              label: 'Sanitarios funcionando',
              description: 'WC e instalaciones operativas',
              suggestions: {
                2: 'Todos los sanitarios en perfecto funcionamiento',
                1: 'Sanitarios funcionando',
                [-1]: 'Algún sanitario con fallas menores',
                [-2]: 'Sanitarios sin funcionar o muy dañados',
              },
            },
          ],
        },
        {
          id: 'salon-personal',
          label: 'Personal',
          weight: 25,
          items: [
            {
              id: 'per-1',
              label: 'Personal uniformado correctamente',
              description: 'Todos deben usar el uniforme completo',
              suggestions: {
                2: 'Todo el personal con uniforme impecable',
                1: 'Personal uniformado',
                [-1]: 'Personal con uniforme incompleto',
                [-2]: 'Personal sin uniforme',
              },
            },
            {
              id: 'per-2',
              label: 'Personal con buena presentación',
              description: 'Higiene personal y apariencia profesional',
              suggestions: {
                2: 'Presentación impecable de todo el personal',
                1: 'Buena presentación general',
                [-1]: 'Algunos empleados con mala presentación',
                [-2]: 'Personal con muy mala presentación',
              },
            },
            {
              id: 'per-3',
              label: 'Atención al cliente cordial',
              description: 'El personal debe ser amable y servicial',
              suggestions: {
                2: 'Atención excepcional y muy cordial',
                1: 'Atención adecuada',
                [-1]: 'Atención deficiente o poco amable',
                [-2]: 'Atención muy mala o grosera',
              },
            },
            {
              id: 'per-4',
              label: 'Conocimiento del menú',
              description: 'El personal conoce los productos',
              suggestions: {
                2: 'Conocimiento excelente de todos los productos',
                1: 'Conocimiento adecuado del menú',
                [-1]: 'Conocimiento limitado del menú',
                [-2]: 'Desconocimiento total del menú',
              },
            },
            {
              id: 'per-5',
              label: 'Rapidez en el servicio',
              description: 'Tiempo de atención adecuado',
              suggestions: {
                2: 'Servicio muy rápido y eficiente',
                1: 'Servicio en tiempo adecuado',
                [-1]: 'Servicio lento',
                [-2]: 'Servicio muy lento',
              },
            },
          ],
        },
        {
          id: 'salon-otros',
          label: 'Otros',
          weight: 2,
          items: [
            {
              id: 'otr-1',
              label: 'Música a volumen adecuado',
              description: 'La música no debe ser molesta',
              suggestions: {
                2: 'Música perfecta para el ambiente',
                1: 'Volumen adecuado',
                [-1]: 'Volumen inadecuado (muy alto o muy bajo)',
                [-2]: 'Música muy molesta o sin música cuando se requiere',
              },
            },
            {
              id: 'otr-2',
              label: 'Menús disponibles y en buen estado',
              description: 'Menús físicos limpios y legibles',
              suggestions: {
                2: 'Menús impecables y bien diseñados',
                1: 'Menús disponibles y legibles',
                [-1]: 'Menús deteriorados o sucios',
                [-2]: 'Menús no disponibles o muy dañados',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'cocina',
      label: 'Cocina',
      categories: [
        {
          id: 'cocina-bpm',
          label: 'BPM (Buenas Prácticas de Manufactura)',
          weight: 40,
          items: [
            {
              id: 'bpm-1',
              label: 'Lavado de manos correcto',
              description: 'Personal sigue protocolo de lavado de manos',
              suggestions: {
                2: 'Protocolo de lavado de manos ejemplar',
                1: 'Lavado de manos adecuado',
                [-1]: 'Lavado de manos deficiente',
                [-2]: 'No se lavan las manos correctamente',
              },
            },
            {
              id: 'bpm-2',
              label: 'Se encuentran productos fuera de fecha de vencimiento?',
              description: 'Verificar que no haya productos vencidos o fuera de fecha en cocina, cámaras, depósitos o áreas de producción.',
              suggestions: {
                2: 'No se detectan productos vencidos y todos los productos están correctamente fechados, rotulados y controlados.',
                1: 'No hay productos vencidos y el control de fechas es correcto.',
                [-1]: 'Se detectan productos sin fecha, mal rotulados o con control deficiente, pero sin evidencia de producto vencido en uso.',
                [-2]: 'Se encuentran productos vencidos, en uso o disponibles para producción/venta.',
              },
            },
            {
              id: 'bpm-3',
              label: 'Separación de alimentos crudos y cocidos',
              description: 'Evitar contaminación cruzada',
              suggestions: {
                2: 'Separación perfecta y sistemática',
                1: 'Separación adecuada',
                [-1]: 'Separación deficiente en algunos casos',
                [-2]: 'No hay separación, riesgo de contaminación',
              },
            },
            {
              id: 'bpm-4',
              label: 'Temperaturas de refrigeración correctas',
              description: 'Refrigeradores a temperatura adecuada (<4°C)',
              suggestions: {
                2: 'Todas las temperaturas en rango óptimo',
                1: 'Temperaturas en rango aceptable',
                [-1]: 'Algunas temperaturas fuera de rango',
                [-2]: 'Temperaturas críticas fuera de rango',
              },
            },
            {
              id: 'bpm-5',
              label: 'Almacenamiento PEPS (Primero en Entrar, Primero en Salir)',
              description: 'Rotación correcta de productos',
              suggestions: {
                2: 'Rotación PEPS ejemplar',
                1: 'Rotación PEPS adecuada',
                [-1]: 'Rotación PEPS deficiente',
                [-2]: 'No se aplica rotación PEPS',
              },
            },
            {
              id: 'bpm-6',
              label: 'Productos etiquetados con fecha',
              description: 'Todos los productos tienen fecha de elaboración/caducidad',
              suggestions: {
                2: 'Etiquetado perfecto de todos los productos',
                1: 'Etiquetado adecuado',
                [-1]: 'Algunos productos sin etiquetar',
                [-2]: 'Mayoría de productos sin etiqueta',
              },
            },
            {
              id: 'bpm-7',
              label: 'Control de plagas activo',
              description: 'No evidencia de plagas, controles vigentes',
              suggestions: {
                2: 'Cero evidencia de plagas, controles al día',
                1: 'Sin evidencia de plagas',
                [-1]: 'Evidencia menor de plagas',
                [-2]: 'Evidencia clara de infestación',
              },
            },
          ],
        },
        {
          id: 'cocina-limpieza',
          label: 'Limpieza',
          weight: 30,
          items: [
            {
              id: 'lim-1',
              label: 'Superficies de trabajo limpias',
              description: 'Mesas y áreas de preparación sanitizadas',
              suggestions: {
                2: 'Superficies impecables',
                1: 'Superficies limpias',
                [-1]: 'Superficies con residuos',
                [-2]: 'Superficies muy sucias',
              },
            },
            {
              id: 'lim-2',
              label: 'Equipos limpios (estufas, hornos, etc.)',
              description: 'Equipos de cocción sin grasa acumulada',
              suggestions: {
                2: 'Equipos impecables',
                1: 'Equipos limpios',
                [-1]: 'Equipos con grasa acumulada',
                [-2]: 'Equipos muy sucios',
              },
            },
            {
              id: 'lim-3',
              label: 'Pisos limpios y secos',
              description: 'Sin charcos ni residuos en el piso',
              suggestions: {
                2: 'Pisos impecables y secos',
                1: 'Pisos limpios',
                [-1]: 'Pisos con residuos o húmedos',
                [-2]: 'Pisos muy sucios o resbalosos',
              },
            },
            {
              id: 'lim-4',
              label: 'Campana extractora limpia',
              description: 'Sin acumulación de grasa',
              suggestions: {
                2: 'Campana impecable',
                1: 'Campana limpia',
                [-1]: 'Campana con grasa acumulada',
                [-2]: 'Campana muy sucia o no funcional',
              },
            },
            {
              id: 'lim-5',
              label: 'Área de lavado limpia',
              description: 'Fregaderos y área de lavado sanitizados',
              suggestions: {
                2: 'Área de lavado impecable',
                1: 'Área de lavado limpia',
                [-1]: 'Área de lavado con suciedad',
                [-2]: 'Área de lavado muy sucia',
              },
            },
          ],
        },
        {
          id: 'cocina-ef',
          label: 'E&F (Equipo y Funcionamiento)',
          weight: 30,
          items: [
            {
              id: 'ef-1',
              label: 'Refrigeradores funcionando',
              description: 'Todos los refrigeradores operativos',
              suggestions: {
                2: 'Refrigeradores en perfecto funcionamiento',
                1: 'Refrigeradores funcionando',
                [-1]: 'Algún refrigerador con fallas',
                [-2]: 'Refrigerador crítico sin funcionar',
              },
            },
            {
              id: 'ef-2',
              label: 'Estufas y hornos funcionando',
              description: 'Equipos de cocción operativos',
              suggestions: {
                2: 'Equipos en perfecto funcionamiento',
                1: 'Equipos funcionando',
                [-1]: 'Algún equipo con fallas menores',
                [-2]: 'Equipo crítico sin funcionar',
              },
            },
            {
              id: 'ef-3',
              label: 'Utensilios en buen estado',
              description: 'Ollas, sartenes, cuchillos en buenas condiciones',
              suggestions: {
                2: 'Utensilios en excelente estado',
                1: 'Utensilios en buen estado',
                [-1]: 'Utensilios deteriorados',
                [-2]: 'Utensilios en mal estado o faltantes',
              },
            },
            {
              id: 'ef-4',
              label: 'Se encuentra cortadora de fiambre y balanza en condiciones, limpia y calibradas?',
              description: 'Verificar limpieza, funcionamiento, estado general y calibración de cortadora de fiambre y balanza.',
              suggestions: {
                2: 'Cortadora y balanza están limpias, funcionando correctamente, en excelente estado y calibradas.',
                1: 'Cortadora y balanza están operativas, limpias y en condiciones aceptables.',
                [-1]: 'Alguno de los equipos presenta suciedad, falta de calibración, deterioro o funcionamiento irregular.',
                [-2]: 'Cortadora o balanza no funcionan, están sucias en nivel riesgoso o no pueden utilizarse correctamente.',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'calidad',
      label: 'Calidad',
      categories: [
        {
          id: 'calidad-producto-mayor-venta',
          label: 'Producto de Mayor Venta',
          weight: 23.33,
          items: [
            {
              id: 'pmv-nombre',
              label: 'Nombre del producto',
              description: 'PRODUCTO DE MAYOR VENTA',
              isTextField: true,
              groupHeader: 'PRODUCTO DE MAYOR VENTA',
            },
            {
              id: 'pmv-presentacion',
              label: 'Presentación del producto',
              description: 'Apariencia visual del platillo',
              suggestions: {
                2: 'Presentación excepcional',
                1: 'Presentación adecuada',
                [-1]: 'Presentación deficiente',
                [-2]: 'Presentación muy mala',
              },
            },
            {
              id: 'pmv-sabor',
              label: 'Sabor del producto',
              description: 'Sabor de acuerdo al estándar',
              suggestions: {
                2: 'Sabor excepcional',
                1: 'Sabor correcto',
                [-1]: 'Sabor no cumple estándar',
                [-2]: 'Sabor muy deficiente',
              },
            },
            {
              id: 'pmv-temperatura',
              label: 'Temperatura de servicio',
              description: 'Producto servido a temperatura correcta',
              suggestions: {
                2: 'Temperatura perfecta',
                1: 'Temperatura adecuada',
                [-1]: 'Temperatura inadecuada',
                [-2]: 'Temperatura muy fuera de rango',
              },
            },
            {
              id: 'pmv-porcion',
              label: 'Porción correcta',
              description: 'Cantidad de acuerdo al estándar',
              suggestions: {
                2: 'Porción generosa y correcta',
                1: 'Porción correcta',
                [-1]: 'Porción menor al estándar',
                [-2]: 'Porción muy pequeña',
              },
            },
            {
              id: 'pmv-tiempo',
              label: 'Tiempo de entrega',
              description: 'Tiempo en minutos desde el pedido',
              isTextField: true,
            },
          ],
        },
        {
          id: 'calidad-producto-frio',
          label: 'Producto Frío',
          weight: 23.33,
          items: [
            {
              id: 'pf-nombre',
              label: 'Nombre del producto',
              description: 'PRODUCTO FRÍO',
              isTextField: true,
              groupHeader: 'PRODUCTO FRÍO',
            },
            {
              id: 'pf-presentacion',
              label: 'Presentación del producto',
              description: 'Apariencia visual del platillo',
              suggestions: {
                2: 'Presentación excepcional',
                1: 'Presentación adecuada',
                [-1]: 'Presentación deficiente',
                [-2]: 'Presentación muy mala',
              },
            },
            {
              id: 'pf-sabor',
              label: 'Sabor del producto',
              description: 'Sabor de acuerdo al estándar',
              suggestions: {
                2: 'Sabor excepcional',
                1: 'Sabor correcto',
                [-1]: 'Sabor no cumple estándar',
                [-2]: 'Sabor muy deficiente',
              },
            },
            {
              id: 'pf-temperatura',
              label: 'Temperatura de servicio',
              description: 'Producto servido a temperatura correcta (frío)',
              suggestions: {
                2: 'Temperatura perfecta',
                1: 'Temperatura adecuada',
                [-1]: 'Temperatura inadecuada',
                [-2]: 'Temperatura muy fuera de rango',
              },
            },
            {
              id: 'pf-porcion',
              label: 'Porción correcta',
              description: 'Cantidad de acuerdo al estándar',
              suggestions: {
                2: 'Porción generosa y correcta',
                1: 'Porción correcta',
                [-1]: 'Porción menor al estándar',
                [-2]: 'Porción muy pequeña',
              },
            },
            {
              id: 'pf-tiempo',
              label: 'Tiempo de entrega',
              description: 'Tiempo en minutos desde el pedido',
              isTextField: true,
            },
          ],
        },
        {
          id: 'calidad-producto-caliente',
          label: 'Producto Caliente',
          weight: 23.34,
          items: [
            {
              id: 'pc-nombre',
              label: 'Nombre del producto',
              description: 'PRODUCTO CALIENTE',
              isTextField: true,
              groupHeader: 'PRODUCTO CALIENTE',
            },
            {
              id: 'pc-presentacion',
              label: 'Presentación del producto',
              description: 'Apariencia visual del platillo',
              suggestions: {
                2: 'Presentación excepcional',
                1: 'Presentación adecuada',
                [-1]: 'Presentación deficiente',
                [-2]: 'Presentación muy mala',
              },
            },
            {
              id: 'pc-sabor',
              label: 'Sabor del producto',
              description: 'Sabor de acuerdo al estándar',
              suggestions: {
                2: 'Sabor excepcional',
                1: 'Sabor correcto',
                [-1]: 'Sabor no cumple estándar',
                [-2]: 'Sabor muy deficiente',
              },
            },
            {
              id: 'pc-temperatura',
              label: 'Temperatura de servicio',
              description: 'Producto servido a temperatura correcta (caliente)',
              suggestions: {
                2: 'Temperatura perfecta',
                1: 'Temperatura adecuada',
                [-1]: 'Temperatura inadecuada',
                [-2]: 'Temperatura muy fuera de rango',
              },
            },
            {
              id: 'pc-porcion',
              label: 'Porción correcta',
              description: 'Cantidad de acuerdo al estándar',
              suggestions: {
                2: 'Porción generosa y correcta',
                1: 'Porción correcta',
                [-1]: 'Porción menor al estándar',
                [-2]: 'Porción muy pequeña',
              },
            },
            {
              id: 'pc-tiempo',
              label: 'Tiempo de entrega',
              description: 'Tiempo en minutos desde el pedido',
              isTextField: true,
            },
          ],
        },
        {
          id: 'calidad-generales',
          label: 'Generales',
          weight: 30,
          items: [
            {
              id: 'gen-1',
              label: 'Consistencia con visitas anteriores',
              description: 'El producto mantiene su calidad habitual',
              suggestions: {
                2: 'Mejor que visitas anteriores',
                1: 'Consistente con visitas anteriores',
                [-1]: 'Peor que visitas anteriores',
                [-2]: 'Mucho peor que antes',
              },
            },
            {
              id: 'gen-2',
              label: 'Hay más pizzas premarcadas que el 30% de su venta o de turnos anteriores?',
              description: 'Verificar que la cantidad de pizzas premarcadas no supere el 30% estimado de venta y que no correspondan a turnos anteriores.',
              suggestions: {
                2: 'La cantidad de pizzas premarcadas es adecuada, fresca, controlada y claramente por debajo del 30% estimado.',
                1: 'Hay pizzas premarcadas dentro del límite permitido y no corresponden a turnos anteriores.',
                [-1]: 'La cantidad de pizzas premarcadas supera el 30% estimado o hay dudas sobre su frescura/rotación.',
                [-2]: 'Hay pizzas premarcadas de turnos anteriores, sin control, en exceso o con riesgo de afectar la calidad del producto.',
              },
            },
            {
              id: 'gen-3',
              label: 'Cumplimiento de estándares de marca',
              description: 'El producto representa la marca correctamente',
              suggestions: {
                2: 'Representa perfectamente la marca',
                1: 'Cumple estándares de marca',
                [-1]: 'No cumple algunos estándares',
                [-2]: 'No representa la marca',
              },
            },
          ],
        },
      ],
    },
  ],
}

// Weight configuration by area for easy reference
export const AREA_WEIGHTS = {
  salon: {
    'salon-exterior': 15,
    'salon-general': 27,
    'salon-barra': 15,
    'salon-farmacia': 4,
    'salon-banos': 12,
    'salon-personal': 25,
    'salon-otros': 2,
  },
  cocina: {
    'cocina-bpm': 40,
    'cocina-limpieza': 30,
    'cocina-ef': 30,
  },
  calidad: {
    'calidad-producto-mayor-venta': 23.33,
    'calidad-producto-frio': 23.33,
    'calidad-producto-caliente': 23.34,
    'calidad-generales': 30,
  },
}

export function getAreaById(areaId: string) {
  return AUDIT_STRUCTURE.areas.find((a) => a.id === areaId)
}

export function getCategoryById(areaId: string, categoryId: string) {
  const area = getAreaById(areaId)
  return area?.categories.find((c) => c.id === categoryId)
}

export function getItemById(itemId: string) {
  for (const area of AUDIT_STRUCTURE.areas) {
    for (const category of area.categories) {
      const item = category.items.find((i) => i.id === itemId)
      if (item) {
        return { item, category, area }
      }
    }
  }
  return null
}

export function getAllItems() {
  const items: Array<{
    item: (typeof AUDIT_STRUCTURE.areas)[0]['categories'][0]['items'][0]
    category: (typeof AUDIT_STRUCTURE.areas)[0]['categories'][0]
    area: (typeof AUDIT_STRUCTURE.areas)[0]
  }> = []

  for (const area of AUDIT_STRUCTURE.areas) {
    for (const category of area.categories) {
      for (const item of category.items) {
        items.push({ item, category, area })
      }
    }
  }

  return items
}
