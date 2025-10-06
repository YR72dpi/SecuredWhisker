<?php

namespace App\Repository;

use App\Entity\MessageRegister;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MessageRegister>
 */
class MessageRegisterRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MessageRegister::class);
    }

    public function getMessages(string $hashedRoomId, string $userId): array
    {

        $sql = <<<SQL
            SELECT m.message_payload
            FROM message_register as m
            WHERE 
                m.room_id = :hashedRoomId
                AND m.for_whom = :forWhom 
            ORDER BY m.id ASC
        SQL;

        $connection = $this->getEntityManager()->getConnection();
        $statement = $connection->prepare($sql);
        
        $result = $statement->executeQuery([
            "hashedRoomId" => $hashedRoomId,
            "forWhom" => $userId
        ]);

        return $result->fetchAllAssociative();

    }

    //    /**
    //     * @return MessageRegister[] Returns an array of MessageRegister objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('m')
    //            ->andWhere('m.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('m.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?MessageRegister
    //    {
    //        return $this->createQueryBuilder('m')
    //            ->andWhere('m.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
