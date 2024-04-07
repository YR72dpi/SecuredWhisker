
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const deleteOldUserByIp = async (ip: string) => {

    const userList = await prisma.user.findMany({
        where: {
            ip: {
                equals: ip
            }
        }
    })

    userList.forEach(async user => {
        await prisma.message.deleteMany({
            where: {
                OR: [
                    { toId: { equals: user.id } },
                    { fromId: { equals: user.id } }
                ]
            }
        })

        await prisma.user.delete({
            where: { id: user.id }
        })
    })

}