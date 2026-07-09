import uuid
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_user
from app.modules.auth.models import Usuario
from app.modules.calendario.crud import obtener_gran_premio, obtener_proximo_gran_premio
from app.modules.acceso.crud import obtener_pase_activo


def verificar_acceso(
    gp_id: uuid.UUID,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Usuario:
    # 1. Administrador tiene acceso libre
    if usuario.rol.nombre == "administrador":
        return usuario

    # 2. Verificar si es el GP gratis asignado
    if usuario.gp_gratis_id == gp_id:
        return usuario

    # 3. Si no tiene carrera gratis asignada, se le asigna el próximo GP
    if usuario.gp_gratis_id is None:
        proximo_gp = obtener_proximo_gran_premio(db)
        if proximo_gp:
            usuario.gp_gratis_id = proximo_gp.id
            db.commit()
            db.refresh(usuario)
            if usuario.gp_gratis_id == gp_id:
                return usuario

    # 4. Verificar si tiene pase de temporada activo
    pase = obtener_pase_activo(db, usuario.id)
    if pase:
        return usuario

    # 5. Si no tiene acceso, lanzar Paywall (HTTP 402 Payment Required)
    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail="Se requiere pase de temporada activo o que sea su GP gratis asignado."
    )
