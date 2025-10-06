<?php

namespace App\Entity;

use App\Repository\MessageRegisterRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MessageRegisterRepository::class)]
class MessageRegister
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $roomId = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateTime = null;
    
    #[ORM\Column(type: Types::TEXT)]
    private ?string $messagePayload = null;

    #[ORM\Column(length: 255)]
    private ?string $forWhom = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRoomId(): ?string
    {
        return $this->roomId;
    }

    public function setRoomId(string $roomId): static
    {
        $this->roomId = $roomId;

        return $this;
    }

    public function getDateTime(): ?\DateTimeImmutable
    {
        return $this->dateTime;
    }

    public function setDateTime(\DateTimeImmutable $dateTime): static
    {
        $this->dateTime = $dateTime;

        return $this;
    }

    public function getMessagePayload(): ?string
    {
        return $this->messagePayload;
    }

    public function setMessagePayload(string $messagePayload): static
    {
        $this->messagePayload = $messagePayload;

        return $this;
    }

    public function getForWhom(): ?string
    {
        return $this->forWhom;
    }

    public function setForWhom(string $forWhom): static
    {
        $this->forWhom = $forWhom;

        return $this;
    }
}
